// Force HMR rebuild for payment.service.ts with draft project fields
import { prisma } from '@/lib/prisma';
import { getPaymentAdapter } from './payment-provider.factory';
import { CreatePaymentParams, PaymentResult, PaymentStatus, WebhookVerificationResult } from './types';

export const PROJECT_CREATION_FEE = 30000; // Rp 30.000 (Backend enforced)

function getPaymentModel() {
  const p = (prisma as any).projectPayment || (prisma as any).ProjectPayment;
  if (p && typeof p.findFirst === 'function') return p;
  
  try {
    const { PrismaClient } = require('.prisma/client');
    const tempPrisma = new PrismaClient();
    if (tempPrisma.projectPayment) return tempPrisma.projectPayment;
  } catch (e) {
    try {
      const { PrismaClient } = require('@prisma/client');
      const tempPrisma = new PrismaClient();
      if (tempPrisma.projectPayment) return tempPrisma.projectPayment;
    } catch (e2) {}
  }
  return (prisma as any).projectPayment;
}

export class PaymentService {
  /**
   * Creates a new payment transaction for Project Creation.
   * Fixed amount of Rp 30.000 strictly enforced on the server-side.
   * Stores draft project data (projectName, description, visibility) in payment session.
   */
  static async createProjectPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const adapter = getPaymentAdapter();
    const amount = PROJECT_CREATION_FEE;
    const model = getPaymentModel();

    // Check if user already has an unused PAID payment
    const existingPaid = await model.findFirst({
      where: {
        userId: params.userId,
        status: 'PAID',
        isUsed: false,
        amount,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPaid) {
      // Auto create project if not created yet
      const project = await PaymentService.autoCreateProjectFromPaidPayment(existingPaid);
      return {
        transactionId: existingPaid.transactionId,
        externalReference: existingPaid.externalReference || undefined,
        status: 'PAID',
        amount: existingPaid.amount,
        currency: existingPaid.currency,
        paymentMethod: existingPaid.paymentMethod,
        paymentProvider: existingPaid.paymentProvider,
        paymentUrl: existingPaid.paymentUrl || undefined,
        qrUrl: existingPaid.qrUrl || undefined,
        vaNumber: existingPaid.vaNumber || undefined,
        bank: existingPaid.bank || undefined,
        expiredAt: existingPaid.expiredAt || undefined,
        createdProjectId: project?.id,
        projectName: project?.projectName || existingPaid.projectName || undefined,
      };
    }

    // Check if user has an unexpired PENDING payment created within last 15 minutes
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const existingPending = await model.findFirst({
      where: {
        userId: params.userId,
        status: 'PENDING',
        paymentMethod: params.paymentMethod,
        createdAt: { gte: fifteenMinsAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingPending && existingPending.expiredAt && existingPending.expiredAt > new Date()) {
      // Update draft details if updated in form
      if (params.projectName) {
        await model.update({
          where: { id: existingPending.id },
          data: {
            projectName: params.projectName.trim(),
            description: params.description?.trim() || null,
            visibility: params.visibility === 'TEAM' ? 'TEAM' : 'PRIVATE',
          },
        });
      }

      return {
        transactionId: existingPending.transactionId,
        externalReference: existingPending.externalReference || undefined,
        status: 'PENDING',
        amount: existingPending.amount,
        currency: existingPending.currency,
        paymentMethod: existingPending.paymentMethod,
        paymentProvider: existingPending.paymentProvider,
        paymentUrl: existingPending.paymentUrl || undefined,
        qrUrl: existingPending.qrUrl || undefined,
        vaNumber: existingPending.vaNumber || undefined,
        bank: existingPending.bank || undefined,
        expiredAt: existingPending.expiredAt || undefined,
        projectName: params.projectName || existingPending.projectName || undefined,
      };
    }

    // Generate unique transaction ID
    const orderId = `PRJ-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Call adapter
    const providerResult = await adapter.createTransaction(params, orderId, amount);

    // Store transaction in database with draft project fields
    const paymentRecord = await model.create({
      data: {
        userId: params.userId,
        amount,
        currency: 'IDR',
        status: 'PENDING',
        paymentMethod: params.paymentMethod,
        paymentProvider: adapter.name,
        transactionId: orderId,
        externalReference: providerResult.externalReference,
        paymentUrl: providerResult.paymentUrl,
        qrUrl: providerResult.qrUrl,
        vaNumber: providerResult.vaNumber,
        bank: providerResult.bank,
        projectName: params.projectName?.trim() || null,
        description: params.description?.trim() || null,
        visibility: params.visibility === 'TEAM' ? 'TEAM' : 'PRIVATE',
        expiredAt: providerResult.expiredAt,
      },
    });

    return {
      transactionId: paymentRecord.transactionId,
      externalReference: paymentRecord.externalReference || undefined,
      status: paymentRecord.status as PaymentStatus,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency,
      paymentMethod: paymentRecord.paymentMethod,
      paymentProvider: paymentRecord.paymentProvider,
      paymentUrl: paymentRecord.paymentUrl || undefined,
      qrUrl: paymentRecord.qrUrl || undefined,
      vaNumber: paymentRecord.vaNumber || undefined,
      bank: paymentRecord.bank || undefined,
      expiredAt: paymentRecord.expiredAt || undefined,
      projectName: paymentRecord.projectName || undefined,
    };
  }

  /**
   * Automatically creates a Project from draft data when payment is verified PAID.
   * Idempotent: Does NOT duplicate projects if payment is already used.
   */
  static async autoCreateProjectFromPaidPayment(paymentRecord: any) {
    if (!paymentRecord || paymentRecord.status !== 'PAID') return null;

    // Idempotency check: if project already created for this payment, return existing project
    if (paymentRecord.isUsed && paymentRecord.usedForProjectId) {
      const existingProject = await prisma.project.findUnique({
        where: { id: paymentRecord.usedForProjectId },
      });
      return existingProject;
    }

    const projectName = paymentRecord.projectName?.trim() || 'Proyek Baru';
    const description = paymentRecord.description?.trim() || null;
    const visibility = paymentRecord.visibility === 'TEAM' ? 'TEAM' : 'PRIVATE';
    const userId = paymentRecord.userId;

    // Transaction to create project & mark payment as used atomically
    const createdProject = await prisma.$transaction(
      async (tx) => {
        // Double check payment inside transaction for concurrency safety
        const freshPayment = await tx.projectPayment.findUnique({
          where: { id: paymentRecord.id },
        });

        if (!freshPayment || freshPayment.status !== 'PAID') {
          return null;
        }

        if (freshPayment.isUsed && freshPayment.usedForProjectId) {
          return await tx.project.findUnique({
            where: { id: freshPayment.usedForProjectId },
          });
        }

        const project = await tx.project.create({
          data: {
            projectName,
            description,
            ownerUserId: userId,
            visibility,
          },
          select: {
            id: true,
            projectName: true,
            description: true,
            ownerUserId: true,
            visibility: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        await tx.projectMember.create({
          data: {
            projectId: project.id,
            userId,
            role: 'OWNER',
          },
        });

        await tx.projectPayment.update({
          where: { id: freshPayment.id },
          data: {
            isUsed: true,
            usedForProjectId: project.id,
          },
        });

        await tx.activityLog.create({
          data: {
            userId,
            projectId: project.id,
            action: 'PROJECT_CREATED',
            description: `Proyek Otomatis Dibuat oleh Sistem setelah Pembayaran Rp30.000 Terverifikasi: "${project.projectName}"`,
          },
        });

        return project;
      },
      { timeout: 15000 }
    );

    return createdProject;
  }

  /**
   * Retrieves payment details by transactionId.
   * Also polls provider status if payment is currently PENDING.
   * Automatically creates project if status becomes PAID.
   */
  static async getPaymentByTransactionId(transactionId: string, userId?: number) {
    const model = getPaymentModel();
    const payment = await model.findUnique({
      where: { transactionId },
    });

    if (!payment) return null;
    if (userId && payment.userId !== userId) return null;

    // Check if expired
    if (payment.status === 'PENDING' && payment.expiredAt && payment.expiredAt < new Date()) {
      const updated = await model.update({
        where: { id: payment.id },
        data: { status: 'EXPIRED' },
      });
      return updated;
    }

    // If PENDING, attempt adapter status refresh
    if (payment.status === 'PENDING') {
      try {
        const adapter = getPaymentAdapter();
        const latest = await adapter.checkStatus(transactionId);
        if (latest && latest.status !== 'PENDING') {
          const updated = await model.update({
            where: { id: payment.id },
            data: {
              status: latest.status,
              paidAt: latest.status === 'PAID' ? new Date() : undefined,
            },
          });

          if (updated.status === 'PAID') {
            await PaymentService.autoCreateProjectFromPaidPayment(updated);
          }

          return updated;
        }
      } catch (err) {
        console.error('[PaymentService] Error checking provider status:', err);
      }
    }

    if (payment.status === 'PAID' && !payment.isUsed) {
      await PaymentService.autoCreateProjectFromPaidPayment(payment);
    }

    return payment;
  }

  /**
   * Checks if user has a verified PAID payment available for creating a project.
   */
  static async getActiveUnusedPayment(userId: number) {
    const model = getPaymentModel();
    const payment = await model.findFirst({
      where: {
        userId,
        status: 'PAID',
        isUsed: false,
        amount: PROJECT_CREATION_FEE,
      },
      orderBy: { paidAt: 'desc' },
    });

    if (payment) {
      await PaymentService.autoCreateProjectFromPaidPayment(payment);
    }

    return payment;
  }

  /**
   * Handles incoming webhooks from payment gateways with strict signature, amount, & idempotency checks.
   * AUTOMATICALLY creates the Project upon verified PAID status.
   */
  static async processWebhook(payload: any, headers?: Record<string, string>) {
    const adapter = getPaymentAdapter();
    const verification: WebhookVerificationResult = await adapter.verifyWebhook(payload, headers);

    if (!verification.isValid || !verification.transactionId) {
      return { success: false, error: 'Signature webhook atau payload tidak valid.' };
    }

    const model = getPaymentModel();
    const transactionId = verification.transactionId;
    const payment = await model.findUnique({
      where: { transactionId },
    });

    if (!payment) {
      return { success: false, error: `Transaksi dengan ID ${transactionId} tidak ditemukan.` };
    }

    // Amount validation
    if (verification.amount && verification.amount !== PROJECT_CREATION_FEE) {
      console.error(`[PaymentService Webhook] Nominal mismatch! Expected ${PROJECT_CREATION_FEE}, got ${verification.amount}`);
      return { success: false, error: 'Nominal pembayaran tidak sesuai.' };
    }

    // Idempotency check: if already PAID, ensure project is created and return
    if (payment.status === 'PAID') {
      const existingProject = await PaymentService.autoCreateProjectFromPaidPayment(payment);
      return { success: true, message: 'Transaksi sudah berstatus PAID sebelumnya.', payment, project: existingProject };
    }

    const newStatus = verification.status || 'PAID';
    const updated = await model.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : payment.paidAt,
      },
    });

    let createdProject = null;
    if (newStatus === 'PAID') {
      createdProject = await PaymentService.autoCreateProjectFromPaidPayment(updated);
    }

    return {
      success: true,
      message: `Status transaksi ${transactionId} diperbarui menjadi ${newStatus}. Proyek otomatis dibuat.`,
      payment: updated,
      project: createdProject,
    };
  }

  /**
   * Simulator helper to mark payment as PAID and automatically create the project.
   */
  static async simulatePaymentSuccess(transactionId: string, userId: number) {
    const model = getPaymentModel();
    const payment = await model.findUnique({
      where: { transactionId },
    });

    if (!payment) throw new Error('Transaksi tidak ditemukan.');
    if (payment.userId !== userId) throw new Error('Anda tidak memiliki akses ke transaksi ini.');

    const updated = await model.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    const project = await PaymentService.autoCreateProjectFromPaidPayment(updated);

    return { payment: updated, project };
  }
}
