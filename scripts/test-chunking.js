const assert = require("assert");

function normalizeText(text) {
    if (!text) return "";
    return text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\bExperi\s+ences\b/gi, "Experiences")
        .replace(/\bExperi\s+ence\b/gi, "Experience")
        .replace(/\bProjek\b/gi, "Project")
        .replace(/\bTech\s+nical\b/gi, "Technical")
        .replace(/\bEdu\s+cation\b/gi, "Education")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function splitProjects(content) {
    const cleanContent = content.trim();
    if (!cleanContent) return [];

    const projectRegex = /(?:^|\n|\s*)(?:Project|Proyek)?\s*(\d+)\s*[\.:\)]\s*([A-Za-z0-9\s&\-\/]+?)(?=\s*(?:Tools|Tech|Description|Key|Responsibilities|\d+\s*[\.:\)]|$))/gi;
    const matches = [...cleanContent.matchAll(projectRegex)];

    if (matches.length === 0) {
        return [{ title: "Project", type: "project", content: cleanContent }];
    }

    const projects = [];
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const projectNumber = parseInt(match[1], 10);
        let rawTitle = match[2].trim().replace(/[\.:]+$/, "");
        rawTitle = rawTitle.split(/(?:\s*(?:Tools\s*&\s*Tech|Description|Key\s+Responsibilities|Responsibilities|-|\n))/i)[0].trim();
        const start = (match.index ?? 0) + match[0].length;
        const end = i + 1 < matches.length ? matches[i + 1].index ?? cleanContent.length : cleanContent.length;
        const projectBody = cleanContent.slice(start, end).trim();

        projects.push({
            title: `Project: ${rawTitle}`,
            type: "project",
            projectIndex: projectNumber,
            content: `Project ${projectNumber}: ${rawTitle}\n\n${projectBody}`,
        });
    }
    return projects;
}

function splitIntoSections(text) {
    if (!text) return [];
    let normalized = normalizeText(text);

    normalized = normalized.replace(/(?:^|\n|\s*)(?:\[TECHNICAL_EXPERIENCES\]|Technical\s+Experi(?:ence|ences)|Work\s+Experience|Pengalaman\s+Kerja)\s*:/gi, "\n\n[BOUNDARY:TECHNICAL_EXPERIENCES]\n");
    normalized = normalized.replace(/(?:^|\n|\s*)(?:\[LANGUAGES\]|Languages|Bahasa)\s*:/gi, "\n\n[BOUNDARY:LANGUAGES]\n");
    normalized = normalized.replace(/(?:^|\n|\s*)(?:\[GITHUB\]|Github|GitHub|Contact|Kontak)\s*:/gi, "\n\n[BOUNDARY:GITHUB]\n");
    normalized = normalized.replace(/(?:^|\n|\s*)(?:\[EDUCATION\]|Education|Pendidikan|Academic)(?:\s*:|\s+|\n)(?=S1|D3|S2|Universitas|Sekolah|Gelar|Tahun|\d{4})/gi, "\n\n[BOUNDARY:EDUCATION]\n");
    normalized = normalized.replace(/(?<!\[BOUNDARY:EDUCATION\]\n)\s+(S1\s+Teknik\s+Informatika|S1\s+Informatika|Bachelor\s+of\b)/gi, "\n\n[BOUNDARY:EDUCATION]\n$1");
    normalized = normalized.replace(/(?:^|\n|\s*)(?:\[PROJECTS\]|Projects|Proyek|Portfolio)(?:\s*:|\s+|\n)(?=(?:Project|Proyek)?\s*1\s*[\.:\)])/gi, "\n\n[BOUNDARY:PROJECTS]\n");
    normalized = normalized.replace(/(?<!\[BOUNDARY:PROJECTS\]\n)\s+((?:Project|Proyek)?\s*1\s*\.\s*[A-Za-z])/gi, "\n\n[BOUNDARY:PROJECTS]\n$1");
    normalized = normalized.replace(/(?:^|\n|\s*)(?:\[SKILLS\]|Experiences\s+Skills|Technical\s+Skills|Skills\s*&\s*Abilities|Keahlian|Kemampuan)\b(?:\s*:|\s+|\n)/gi, "\n\n[BOUNDARY:SKILLS]\n");

    const boundaryRegex = /\[BOUNDARY:(TECHNICAL_EXPERIENCES|LANGUAGES|GITHUB|EDUCATION|PROJECTS|SKILLS)\]/gi;
    const matches = [...normalized.matchAll(boundaryRegex)];

    if (matches.length === 0) {
        return [{ title: "General", type: "general", content: normalized }];
    }

    const sections = [];
    const firstBoundaryIndex = matches[0].index ?? normalized.length;
    const profileText = normalized.slice(0, firstBoundaryIndex).trim();

    if (profileText) {
        sections.push({ title: "Profile", type: "profile", content: profileText });
    }

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const boundaryType = match[1].toUpperCase();
        const start = (match.index ?? 0) + match[0].length;
        const end = i + 1 < matches.length ? matches[i + 1].index ?? normalized.length : normalized.length;
        const segmentContent = normalized.slice(start, end).trim();

        if (!segmentContent) continue;

        if (boundaryType === "PROJECTS") {
            sections.push(...splitProjects(segmentContent));
            continue;
        }

        const typeMap = {
            SKILLS: { title: "Skills", type: "skills" },
            EDUCATION: { title: "Education", type: "education" },
            TECHNICAL_EXPERIENCES: { title: "Technical Experiences", type: "technical" },
            LANGUAGES: { title: "Languages", type: "languages" },
            GITHUB: { title: "Github", type: "github" },
        };

        const mapped = typeMap[boundaryType] ?? { title: boundaryType, type: "general" };
        sections.push({ title: mapped.title, type: mapped.type, content: segmentContent });
    }

    return sections;
}

function runSectionParserTests() {
    console.log("==========================================");
    console.log("   AUTOMATED SECTION PARSER TEST SUITE   ");
    console.log("==========================================");

    const sampleCVText = `Tara Alsyah IT Support / Web Developer
Experiences Skills HTML CSS Javascript PHP MySQL Python Django Git GitLab IT Support Pemeliharaan Hardware Handle Ticket Helpdesk
Education S1 Teknik Informatika Universitas Bina Sarana Informatika 2025
Projects
1. System Web Ticketing Tools & Tech: PHP, MySQL Description: System Web Ticketing ticketing system...
2. Email and Telegram Notification Tools & Tech: Python, Django Description: Notification bot...
3. SMSC Knowledge Tools & Tech: PHP Description: SMSC Knowledge base...
Technical Experiences: IT Support Staff at ICode
Languages: Bahasa Indonesia, English
Github: github.com/taraalsyah`;

    const sections = splitIntoSections(sampleCVText);

    console.log(`\nExtracted ${sections.length} Sections:`);
    sections.forEach((sec, i) => {
        console.log(`\n[${i}] Title: "${sec.title}" | Type: ${sec.type}`);
        console.log(`Content Snippet: ${sec.content.substring(0, 80)}...`);
    });

    // Assertions
    assert.strictEqual(sections[0].title, "Profile");
    assert.strictEqual(sections[1].title, "Skills");
    assert.strictEqual(sections[2].title, "Education");
    assert.strictEqual(sections[3].title, "Project: System Web Ticketing");
    assert.strictEqual(sections[4].title, "Project: Email and Telegram Notification");
    assert.strictEqual(sections[5].title, "Project: SMSC Knowledge");
    assert.strictEqual(sections[6].title, "Technical Experiences");
    assert.strictEqual(sections[7].title, "Languages");
    assert.strictEqual(sections[8].title, "Github");

    // Assertion: Verify Education chunk is clean
    assert.ok(sections[2].content.includes("S1 Teknik Informatika"), "Education must contain S1");
    assert.ok(!sections[2].content.includes("System Web Ticketing"), "Education must NOT contain Projects");
    assert.ok(!sections[2].content.includes("HTML CSS"), "Education must NOT contain Skills");

    // Assertion: Verify Projects are 3 separate chunks
    assert.ok(sections[3].content.includes("System Web Ticketing"), "Project 1 correct");
    assert.ok(!sections[3].content.includes("Email and Telegram"), "Project 1 must NOT contain Project 2");

    console.log("\n✅ ALL 9 SECTION BOUNDARY PARSER ASSERTIONS PASSED SUCCESSFULLY!");
}

runSectionParserTests();
