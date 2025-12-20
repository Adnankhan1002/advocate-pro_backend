const { z } = require('zod');

if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not configured. Document generation will use fallback mode.');
}

/**
 * Zod schemas for different legal documents
 */
const documentSchemas = {
  bail_application: z.object({
    caption: z.string().describe('Court name, case number, and parties'),
    heading: z.string().describe('IN THE MATTER OF BAIL APPLICATION'),
    grounds_for_bail: z.string().describe('Legal and factual basis citing IPC sections'),
    factual_background: z.string().describe('Clear chronological narrative of events'),
    legal_grounds: z.string().describe('Relevant sections of CrPC, IPC, and case law'),
    character_and_antecedents: z.string().describe('Personal details, occupation, community ties'),
    conditions_of_bail: z.string().describe('Suggested conditions as per CrPC Section 437'),
    prayer: z.string().describe('Clear prayer sought before the court'),
    conclusion: z.string().describe('Formal closing and signature block'),
  }),
  
  legal_notice: z.object({
    header: z.string().describe('Lawyer details, date, and recipient information'),
    heading: z.string().describe('LEGAL NOTICE heading'),
    salutation: z.string().describe('To, [Recipient details]'),
    subject_line: z.string().describe('Subject line with case reference'),
    opening_statement: z.string().describe('Opening citing legal authority'),
    factual_background: z.string().describe('Clear narrative of events'),
    legal_grounds: z.string().describe('Cite relevant laws and sections'),
    rights_and_remedies: z.string().describe('Consequences of non-compliance'),
    demands_and_relief: z.string().describe('Specific, measurable, time-bound demands'),
    time_to_respond: z.string().describe('Timeline for response (usually 7-30 days)'),
    consequences: z.string().describe('Consequences of non-compliance'),
    closure: z.string().describe('Formal closing and signature block'),
  }),

  petition: z.object({
    caption: z.string().describe('Court name, jurisdiction, and party details'),
    heading: z.string().describe('PETITION UNDER [RELEVANT SECTION]'),
    particulars_of_parties: z.string().describe('Full names, addresses, occupations'),
    particulars_of_opposite_party: z.string().describe('Details of opposite party'),
    relief_sought: z.string().describe('Clear prayer with specific demands'),
    grounds_of_petition: z.string().describe('Numbered paragraphs with legal and factual basis'),
    factual_background: z.string().describe('Detailed chronological narrative'),
    legal_grounds: z.string().describe('Relevant laws, Constitution sections, case law'),
    why_relief_should_be_granted: z.string().describe('Legal arguments and reasoning'),
    supporting_documents: z.string().describe('List of annexures and supporting docs'),
    prayer: z.string().describe('WHEREFORE, the petitioner prays as follows'),
    verification_clause: z.string().describe('Declaration under oath as per CPC'),
    signature_block: z.string().describe('Signature, date, and designation'),
  }),
};

/**
 * Prompts for different legal documents in Indian Legal Style
 */
const LEGAL_DOCUMENT_PROMPTS = {
  bail_application: `You are an expert Indian constitutional lawyer specializing in criminal law and bail proceedings. Generate a professional Bail Application document following Indian legal conventions and the Criminal Procedure Code, 1973.

IMPORTANT INSTRUCTIONS:
- Use formal legal language with proper citation format
- Reference relevant sections of CrPC 1973 (especially Sections 437, 438)
- Include relevant IPC sections
- Maintain neutral tone
- Structure with proper headings and numbering
- Use "it is most humbly submitted that" in appropriate places
- End with "WHEREFORE" before prayer
- Format dates as DD/MM/YYYY
- Use proper honorifics (Your Lordship/Lordships)

INPUT DATA:
Facts: {facts}
FIR Details: {fir}
Client Details: {clientDetails}
Additional Information: {additionalInfo}

Generate a comprehensive, court-ready Bail Application document following the structured format.`,

  legal_notice: `You are an expert Indian lawyer experienced in drafting legal notices compliant with Indian law and procedure. Generate a professional Legal Notice following proper legal formatting and Indian legal conventions.

IMPORTANT INSTRUCTIONS:
- Use formal, professional legal language
- Maintain official tone
- Reference applicable laws and sections
- Be specific about demands and timeline
- Use "hereby give notice" and similar formal phrases
- Include date in DD/MM/YYYY format
- Add service method instructions
- Structure with proper numbering and formatting
- Include legal references and case law where relevant

INPUT DATA:
Facts: {facts}
FIR Details: {fir}
Client Details: {clientDetails}
Additional Information: {additionalInfo}

Generate a comprehensive legal notice approximately 600-1000 words, ready for service.`,

  petition: `You are an expert Indian constitutional and civil lawyer. Generate a professional Petition document following Indian legal procedures and conventions, suitable for filing in court.

IMPORTANT INSTRUCTIONS:
- Use formal legal language with proper sections/article citations
- Number all paragraphs clearly
- Reference Constitution of India articles where relevant
- Include relevant case law and precedents
- Maintain professional legal tone
- Use "it is humbly submitted that" construction
- Format all dates as DD/MM/YYYY
- Include prayer for interim reliefs if applicable
- Add verification clause as per Civil Procedure Code
- Structure arguments logically and persuasively

INPUT DATA:
Facts: {facts}
FIR Details: {fir}
Client Details: {clientDetails}
Additional Information: {additionalInfo}

Generate a comprehensive petition document approximately 1000-1500 words, ready for filing.`,
};

/**
 * Generate legal document using Gemini API with streaming
 * @param {string} documentType - Type of document (bail_application, legal_notice, petition)
 * @param {object} inputData - Data for the document
 * @param {function} onChunk - Callback for each streamed chunk
 * @returns {Promise<string>} - Complete generated document content
 */
async function generateLegalDocumentStream(documentType, inputData, onChunk) {
  try {
    const promptTemplate = LEGAL_DOCUMENT_PROMPTS[documentType];
    if (!promptTemplate) {
      throw new Error(`Unsupported document type: ${documentType}`);
    }

    const schema = documentSchemas[documentType];
    if (!schema) {
      throw new Error(`No schema defined for document type: ${documentType}`);
    }

    // Replace placeholders with actual data
    let prompt = promptTemplate
      .replace('{facts}', inputData.facts || 'Not provided')
      .replace('{fir}', inputData.fir || 'Not provided')
      .replace('{clientDetails}', inputData.clientDetails || 'Not provided')
      .replace('{additionalInfo}', inputData.additionalInfo || 'Not provided');

    console.log(`📄 Generating ${documentType} document...`);

    // Try to use Gemini API if configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = require('@google/genai');
        const { zodToJsonSchema } = require('zod-to-json-schema');
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const stream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseJsonSchema: zodToJsonSchema(schema),
          },
        });

        let jsonBuffer = '';

        for await (const chunk of stream) {
          try {
            const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              jsonBuffer += text;
              if (onChunk) onChunk(text);
              console.log('📝 Received chunk');
            }
          } catch (chunkError) {
            console.warn('⚠️  Chunk processing error:', chunkError.message);
          }
        }

        // Parse and reconstruct
        try {
          const jsonData = JSON.parse(jsonBuffer);
          const document = reconstructDocumentFromJSON(documentType, jsonData);
          console.log(`✓ Document generated (${document.length} chars)`);
          return document;
        } catch (parseError) {
          console.warn('⚠️  JSON parse error, using fallback:', parseError.message);
          const fallback = generateSimpleDocument(documentType, inputData);
          if (onChunk) onChunk(fallback);
          return fallback;
        }
      } catch (aiError) {
        console.warn('⚠️  Gemini API error, using fallback:', aiError.message);
        const fallback = generateSimpleDocument(documentType, inputData);
        if (onChunk) onChunk(fallback);
        return fallback;
      }
    }

    // Fallback generation
    console.log('ℹ️  Using fallback document generation');
    const fallbackDoc = generateSimpleDocument(documentType, inputData);
    if (onChunk) onChunk(fallbackDoc);
    return fallbackDoc;
  } catch (error) {
    console.error('❌ Error generating legal document:', error.message);
    throw error;
  }
}

/**
 * Simple fallback document generator
 */
function generateSimpleDocument(documentType, inputData) {
  let doc = '';

  if (documentType === 'bail_application') {
    doc = `
IN THE MATTER OF BAIL APPLICATION

TO, THE HON'BLE COURT

It is most humbly submitted that:

FACTUAL BACKGROUND:
${inputData.facts || 'Not provided'}

FIR DETAILS:
${inputData.fir || 'Not provided'}

APPLICANT DETAILS:
${inputData.clientDetails || 'Not provided'}

GROUNDS FOR BAIL:
As per the provisions of Section 437 and 438 of the Criminal Procedure Code, 1973, the applicant is entitled to bail.

${inputData.additionalInfo ? `ADDITIONAL INFORMATION:\n${inputData.additionalInfo}` : ''}

WHEREFORE, the applicant most humbly prays before this Hon'ble Court to grant bail to the applicant as per law.

Dated: ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')}
    `;
  } else if (documentType === 'legal_notice') {
    doc = `
LEGAL NOTICE

TO,
${inputData.clientDetails || 'Recipient details'}

Date: ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')}

LEGAL NOTICE

Kindly take notice that:

FACTUAL BACKGROUND:
${inputData.facts || 'Not provided'}

FIR REFERENCE:
${inputData.fir || 'Not provided'}

LEGAL GROUNDS:
${inputData.additionalInfo || 'As per applicable laws of India'}

You are hereby required to comply within 7 (seven) days of receipt of this notice. Failure to comply shall result in further proceedings as per law.

Yours faithfully,
    `;
  } else if (documentType === 'petition') {
    doc = `
PETITION

IN THE MATTER OF

Petition under applicable jurisdiction

PARTICULARS OF PARTIES:
${inputData.clientDetails || 'Petitioner details'}

RELIEF SOUGHT:
As per the grounds mentioned below.

FACTUAL BACKGROUND:
${inputData.facts || 'Not provided'}

FIR REFERENCE:
${inputData.fir || 'Not provided'}

GROUNDS:
${inputData.additionalInfo || 'Not provided'}

WHEREFORE, the petitioner prays for the relief as stated above.

VERIFICATION CLAUSE:
I verify that the contents of this petition are true to my knowledge and belief.

Dated: ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/')}
    `;
  }

  return doc.trim();
}

/**
 * Reconstruct formatted document from JSON schema
 */
function reconstructDocumentFromJSON(documentType, jsonData) {
  let document = '';

  if (documentType === 'bail_application') {
    document = `
${jsonData.caption || ''}

${jsonData.heading || ''}

${jsonData.grounds_for_bail ? `GROUNDS FOR BAIL:\n${jsonData.grounds_for_bail}\n\n` : ''}
${jsonData.factual_background ? `FACTUAL BACKGROUND:\n${jsonData.factual_background}\n\n` : ''}
${jsonData.legal_grounds ? `LEGAL GROUNDS:\n${jsonData.legal_grounds}\n\n` : ''}
${jsonData.character_and_antecedents ? `CHARACTER AND ANTECEDENTS:\n${jsonData.character_and_antecedents}\n\n` : ''}
${jsonData.conditions_of_bail ? `CONDITIONS OF BAIL:\n${jsonData.conditions_of_bail}\n\n` : ''}

WHEREFORE, it is most humbly submitted that:

${jsonData.prayer || ''}

${jsonData.conclusion || ''}
    `;
  } else if (documentType === 'legal_notice') {
    document = `
${jsonData.header || ''}

Date: ${new Date().toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-')}

${jsonData.salutation || ''}

${jsonData.heading || ''}

${jsonData.subject_line ? `SUBJECT: ${jsonData.subject_line}\n\n` : ''}

${jsonData.opening_statement || ''}

${jsonData.factual_background ? `\nFACTUAL BACKGROUND:\n${jsonData.factual_background}\n` : ''}
${jsonData.legal_grounds ? `\nLEGAL GROUNDS:\n${jsonData.legal_grounds}\n` : ''}
${jsonData.rights_and_remedies ? `\nRIGHTS AND REMEDIES:\n${jsonData.rights_and_remedies}\n` : ''}
${jsonData.demands_and_relief ? `\nDEMANDS AND RELIEF SOUGHT:\n${jsonData.demands_and_relief}\n` : ''}
${jsonData.time_to_respond ? `\nTIME TO RESPOND:\n${jsonData.time_to_respond}\n` : ''}
${jsonData.consequences ? `\nCONSEQUENCES OF NON-COMPLIANCE:\n${jsonData.consequences}\n` : ''}

${jsonData.closure || ''}
    `;
  } else if (documentType === 'petition') {
    document = `
${jsonData.caption || ''}

${jsonData.heading || ''}

PARTICULARS OF THE PARTIES:
${jsonData.particulars_of_parties || ''}

PARTICULARS OF THE OPPOSITE PARTY:
${jsonData.particulars_of_opposite_party || ''}

RELIEF SOUGHT:
${jsonData.relief_sought || ''}

GROUNDS OF PETITION:
${jsonData.grounds_of_petition || ''}

FACTUAL BACKGROUND:
${jsonData.factual_background || ''}

LEGAL GROUNDS:
${jsonData.legal_grounds || ''}

WHY RELIEF SHOULD BE GRANTED:
${jsonData.why_relief_should_be_granted || ''}

SUPPORTING DOCUMENTS:
${jsonData.supporting_documents || ''}

WHEREFORE, the petitioner prays as follows:
${jsonData.prayer || ''}

VERIFICATION CLAUSE:
${jsonData.verification_clause || ''}

${jsonData.signature_block || ''}
    `;
  }

  return document.trim();
}

/**
 * Generate document title based on type and case info
 */
function generateDocumentTitle(documentType, caseNumber, caseTitle) {
  const titleMap = {
    bail_application: `Bail Application - Case ${caseNumber}`,
    legal_notice: `Legal Notice - ${caseTitle}`,
    petition: `Petition - Case ${caseNumber}`,
  };
  return titleMap[documentType] || `Legal Document - ${caseNumber}`;
}

module.exports = {
  generateLegalDocumentStream,
  generateDocumentTitle,
  LEGAL_DOCUMENT_PROMPTS,
  documentSchemas,
  reconstructDocumentFromJSON,
};
