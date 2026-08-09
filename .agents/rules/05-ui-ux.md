---
trigger: always_on
---

# UI & UX Design Rules

## 1. Design System

Project menggunakan design system yang konsisten untuk seluruh aplikasi.

Sebelum membuat atau mengubah UI:

1. Periksa existing design system.
2. Periksa shared UI components.
3. Periksa existing CSS variables/tokens.
4. Periksa component dan CSS pattern pada module terkait.
5. Reuse existing implementation jika memungkinkan.

Jangan membuat design system baru untuk satu feature.

---

## 2. Visual Style

Project saat ini menggunakan visual style yang mengarah pada:

* Enterprise application
* Dark UI
* Glassmorphism
* Modern minimal interface
* Clear visual hierarchy
* Consistent spacing
* Consistent border radius
* Subtle transitions

Namun style tersebut harus tetap mengikuti implementation existing.

Jangan memaksakan glassmorphism pada component yang tidak membutuhkannya.

Prioritaskan:

```text id="7w2n8p"
Usability
    ↓
Consistency
    ↓
Accessibility
    ↓
Visual Design
```

---

## 3. CSS Architecture

Gunakan CSS architecture yang sudah digunakan oleh module tersebut.

Jika module menggunakan CSS Modules, pertahankan CSS Modules.

Contoh existing pattern:

```text id="4c7m2x"
task.module.css
project.module.css
activity.module.css
```

Jangan mengubah CSS architecture secara global hanya untuk satu component.

Sebelum membuat CSS baru:

1. Cari existing class.
2. Cari shared style.
3. Cari CSS variable.
4. Cari reusable component.
5. Reuse existing style jika memungkinkan.

---

## 4. Design Tokens

Gunakan existing CSS variables/design tokens.

Contoh:

```css id="1q6k9a"
var(--primary-glow)
var(--glass-border)
var(--secondary)
var(--fg-color)
```

Jangan hard-code warna jika token yang sesuai sudah tersedia.

Jika membutuhkan token baru:

1. Periksa apakah token existing dapat digunakan.
2. Jika benar-benar diperlukan, gunakan naming yang konsisten.
3. Jangan membuat duplicate token dengan fungsi yang sama.

Jangan mengubah global color tokens untuk memperbaiki satu component tanpa memahami impact terhadap seluruh aplikasi.

---

## 5. Typography

Gunakan typography yang konsisten dengan existing application.

Prioritaskan:

* readable font size
* clear hierarchy
* sufficient line-height
* consistent font weights
* appropriate contrast

Gunakan Google Fonts atau system fonts sesuai existing project setup.

Jangan menambahkan font baru hanya untuk satu component tanpa kebutuhan.

---

## 6. Icons

Gunakan existing icon library.

Project menggunakan:

```text id="g7k3qp"
Lucide React
```

Prioritaskan icon dari library tersebut daripada:

* emoji
* inline SVG baru
* icon image
* character symbols

kecuali ada kebutuhan khusus.

Icon harus memiliki ukuran dan alignment yang konsisten dengan component lainnya.

---

## 7. Responsive Design

Semua feature baru harus mempertimbangkan:

```text id="8n2f5c"
Desktop
Tablet
Mobile
```

Jangan hanya membuat UI berdasarkan desktop viewport.

Sebelum menyatakan UI selesai, periksa minimal:

```text id="m4v7qa"
Desktop
Tablet
Mobile
```

Perhatikan:

* overflow
* spacing
* button size
* text wrapping
* table width
* modal size
* navigation
* form layout
* touch interaction

---

## 8. Mobile Modal Behavior

Untuk viewport mobile, modal yang membutuhkan interaksi penuh dapat menggunakan full-screen layout.

Breakpoint existing:

```text id="q7x4mz"
<= 768px
```

Untuk modal yang memang membutuhkan full-screen experience:

```text id="2v8k6p"
width: 100%;
height: 100dvh;
max-height: 100dvh;
margin: 0;
```

Modal harus menghindari:

* floating side margins yang terlalu sempit
* content terpotong
* modal lebih tinggi dari viewport
* double scrollbar
* footer yang tidak dapat dijangkau

Namun, **tidak semua modal harus fullscreen**.

Modal sederhana seperti:

* confirmation dialog
* delete confirmation
* small alert
* short form

boleh tetap menggunakan modal compact jika UX lebih baik.

---

## 9. Mobile Modal Structure

Untuk fullscreen modal:

```text id="b9n3wk"
Viewport
┌──────────────────────┐
│ Header               │
├──────────────────────┤
│                      │
│ Scrollable Content   │
│                      │
├──────────────────────┤
│ Footer / Actions     │
└──────────────────────┘
```

Pastikan:

* header tetap accessible
* content dapat scroll
* footer tetap dapat digunakan
* keyboard tidak menutupi input/action
* tidak terjadi nested scrolling yang tidak diperlukan

Gunakan `100dvh` jika sesuai dengan existing browser support dan layout.

---

## 10. Mobile Modal Border Radius

Border radius harus mengikuti design system.

Untuk modal yang muncul dari bottom:

```text id="8x4v2p"
border-radius: 16px 16px 0 0;
```

dapat digunakan jika sesuai dengan existing design.

Pada viewport yang sangat kecil, radius dapat dikurangi atau dihilangkan jika diperlukan untuk memaksimalkan usable area.

Jangan menerapkan radius secara global kepada semua modal tanpa mempertimbangkan jenis modal.

---

## 11. Touch Scrolling

Horizontal content harus dapat di-scroll pada mobile jika content memang lebih lebar dari viewport.

Contoh:

```text id="x8m5qk"
Tabs
Wide tables
Horizontal filters
Kanban
```

Gunakan pattern seperti:

```css id="f2k7qa"
overflow-x: auto;
-webkit-overflow-scrolling: touch;
```

Jangan memaksa content wide menjadi sangat kecil hanya untuk menghindari horizontal scrolling.

---

## 12. Data Tables on Mobile

Data table harus tetap usable pada mobile.

Jika table tidak dapat direflow secara reasonable:

```text id="w4c8yp"
Table Container
    ↓
Horizontal Scroll
```

Pastikan:

* header tetap terbaca
* row tidak menyebabkan page overflow
* horizontal scroll hanya terjadi pada container yang diperlukan
* action column tetap usable
* text tidak dipaksa menjadi terlalu kecil

Jangan menggunakan:

```text id="q3n7hx"
font-size: 8px
```

atau teknik serupa hanya untuk memaksa seluruh table masuk viewport.

---

## 13. Mobile Buttons

Button dalam modal dan form harus memiliki touch target yang nyaman.

Pada mobile, modal footer dapat menggunakan:

```text id="r6m2vk"
display: flex;
flex-direction: column;
width: 100%;
```

jika jumlah action dan design memang cocok untuk stacked buttons.

Untuk dua action sederhana, horizontal buttons juga dapat digunakan jika tetap usable.

Jangan memaksakan stacked buttons pada semua modal.

---

## 14. Forms

Form harus mempertimbangkan mobile interaction.

Perhatikan:

* input width
* label readability
* keyboard behavior
* select/dropdown positioning
* date picker positioning
* error messages
* button accessibility
* spacing antar field

Input tidak boleh terpotong oleh viewport.

Dropdown/popover harus menyesuaikan available viewport space.

---

## 15. Loading States

Loading state harus mempertahankan layout jika memungkinkan.

Untuk existing content:

```text id="n8q5wz"
Existing Data
      +
Loading Indicator
```

lebih baik daripada:

```text id="d2x7mk"
Existing Data
      ↓
Entire UI replaced by spinner
```

Hindari layout shift yang tidak diperlukan.

Untuk table pagination/filter:

* pertahankan table
* pertahankan header
* pertahankan pagination
* gunakan background loading indicator
* jangan mengganti seluruh table dengan full-page spinner

---

## 16. Empty States

Empty state harus menjelaskan:

1. Apa yang kosong.
2. Kenapa mungkin kosong jika relevan.
3. Action yang dapat dilakukan user jika tersedia.

Jangan menggunakan empty state yang terlalu generik seperti:

```text id="x8q2nm"
No data.
```

jika context-specific message dapat diberikan.

---

## 17. Error States

Error message harus:

* jelas
* actionable jika memungkinkan
* tidak menampilkan sensitive information
* konsisten dengan existing notification/error system

Gunakan existing toast, alert, modal, atau error component jika tersedia.

Jangan membuat notification system baru untuk satu feature.

---

## 18. Accessibility

UI harus mempertimbangkan accessibility.

Minimal:

* interactive elements harus keyboard accessible
* buttons harus memiliki accessible label jika icon-only
* form fields harus memiliki label
* focus state harus terlihat
* color contrast harus cukup
* modal harus memiliki accessible title/description jika diperlukan

Jangan menggunakan color sebagai satu-satunya indikator status.

---

## 19. Interaction Consistency

Interaction yang sama harus memiliki behavior yang konsisten.

Contoh:

```text id="r7k3xc"
Delete
Edit
Save
Cancel
Loading
Success
Error
Confirmation
```

Jika existing application menggunakan custom confirmation popup atau toast, gunakan implementation tersebut.

Jangan menggunakan browser-native `alert()`, `confirm()`, atau `prompt()` jika project sudah memiliki custom UI untuk fungsi tersebut.

---

## 20. Animation

Gunakan animation secara subtle dan purposeful.

Animation dapat digunakan untuk:

* modal opening/closing
* loading
* list transitions
* Kanban movement
* state changes

Hindari animation yang:

* terlalu lama
* mengganggu interaction
* membuat UI terasa lambat
* berjalan terus-menerus tanpa alasan

---

## 21. Existing UI First

Sebelum membuat UI baru:

1. Cari existing component.
2. Cari existing modal.
3. Cari existing button.
4. Cari existing input.
5. Cari existing table.
6. Cari existing toast.
7. Cari existing loading component.
8. Cari existing CSS tokens.
9. Reuse jika memungkinkan.

Jangan membuat duplicate component jika existing component dapat digunakan.

---

## 22. No Unnecessary Global Changes

Jangan mengubah:

* global CSS
* theme
* typography
* color tokens
* breakpoints
* shared components

hanya untuk menyelesaikan masalah pada satu feature.

Jika global change benar-benar diperlukan, periksa impact terhadap seluruh aplikasi terlebih dahulu.

---

## 23. Rule Maintenance

File rule ini merupakan living documentation.

Jika technical implementation UI berubah dan rule menjadi outdated, AI boleh memperbarui `.md` secara otomatis jika perubahan tersebut dapat diverifikasi.

Contoh:

```text id="z8m4ps"
Old:
task.module.css

Actual:
tasks.module.css
```

AI boleh memperbarui reference tersebut.

Namun, jangan mengubah design/business requirement secara sepihak.

---

## 24. Scope Control

Ketika mengerjakan UI:

* Jangan melakukan redesign besar tanpa instruksi.
* Jangan mengganti design system tanpa instruksi.
* Jangan mengubah global theme tanpa kebutuhan.
* Jangan membuat component duplicate.
* Jangan mengubah layout module lain tanpa alasan.
* Jangan menambahkan dependency UI baru tanpa kebutuhan.

Prioritaskan perubahan minimum yang menyelesaikan requirement.

---

## 25. Final UI Principle

Prioritas UI:

```text id="k6v9tx"
Usability
    ↓
Accessibility
    ↓
Responsive Behavior
    ↓
Consistency
    ↓
Performance
    ↓
Visual Polish
```

UI harus terlihat bagus, tetapi functionality dan usability lebih penting daripada visual effect.
