# AreaHustle — Responsible AI & Ethics Statement

## 1. Introduction & Ethical Mission

AreaHustle was conceived with a clear social mission: **to empower the informal African workforce through equitable, voice-first digital access**. In designing our AI architecture for the **Sahara CodeSwitch Africa Challenge**, we adhere to strict ethical AI guidelines, ensuring that our system protects user privacy, eliminates bias, guarantees transparent financial transactions, and treats informal workers with dignity.

---

## 2. Audio Privacy, Consent & Data Lifecycle

### 2.1. Explicit Physical Consent (Zero Passive Listening)
- AreaHustle **never** uses background listening, always-on microphones, or wake-word detection.
- Audio recording is triggered exclusively by an intentional physical interaction (the user tapping the microphone button) and stopped either manually or upon speech completion.
- The browser microphone permission modal is explicitly presented to the user with a clear explanation of purpose.

### 2.2. Ephemeral In-Memory Processing
- Audio buffers uploaded to the backend are processed strictly in volatile memory.
- Audio data is transmitted securely via HTTPS/TLS 1.3 to Intron Health's Sahara STT API for transcription.
- **No audio recordings are permanently stored on AreaHustle application servers or local user disk storage.** Once transcription is completed, the memory buffer is dereferenced and garbage collected.

### 2.3. Zero Third-Party Audio Monetization
- User voice notes are never sold, licensed, or shared with advertising networks, third-party data brokers, or external analytics firms.

---

## 3. Linguistic Equity & Algorithmic Inclusion

### 3.1. Mitigating Language & Accent Discrimination
- Traditional digital tools enforce standard British or American English, penalizing individuals who speak non-standard dialects or code-switch.
- By deploying Intron Sahara Voice STT—trained specifically on indigenous West African phonetics and conversational Nigerian Pidgin (`pcm`)—AreaHustle validates the natural way African artisans speak. Literacy level or linguistic background is never a barrier to economic participation.

### 3.2. Error Tolerance & Human-in-the-Loop Review
- While the voice pipeline automatically structures job attributes, the system **never** creates an immutable contractual obligation without human confirmation.
- The customer always reviews the structured card (Category, Budget, Location, Description) and explicitly taps "Lock Escrow" before any task is published or funds are committed.

---

## 4. Privacy & Identity Protection (PII Safeguards)

### 4.1. Escrow-Gated Contact Disclosure
- To protect both parties from harassment, stalking, or off-platform scams, sensitive contact details (such as phone numbers or exact street addresses) are concealed on public job feeds.
- Contact information is unlocked **only** after a hustler officially accepts the gig (`status: "matched"`), ensuring that only verified counterparties in a current transaction can communicate.

### 4.2. Sensitive Entity Redaction
- In downstream LLM processing (Google Gemini), prompt instructions enforce the redaction of sensitive payment details, BVNs (Bank Verification Numbers), or national identification numbers from publicly visible job descriptions.

---

## 5. Economic Fairness & Transparent Escrow

### 5.1. Transparent Pricing
- All task payouts and fees are displayed clearly in Nigerian Naira (₦). There are no hidden fees or dynamic price gouging algorithms applied to vulnerable workers.

### 5.2. Escrow Protection Against Exploitation
- The primary financial risk for informal artisans is non-payment after completing labor. By locking the agreed funds in escrow prior to dispatch, workers are guaranteed that payment exists and is waiting for them upon job delivery.
- Customers maintain the authority to inspect the work prior to releasing payment, protecting them against substandard execution.

### 5.3. Portable, Artisan-Owned Reputation
- The **Financial Passport** algorithm evaluates verifiable, objective transaction signals (completion rate, repeat client ratio, dispute-free history). This credit identity is portable, designed to help informal artisans qualify for fair institutional micro-credit without exploitative loan shark interest rates.

---

## 6. Feedback, Redress & Continuous Auditing

- Users can report offensive, dangerous, or illegal task postings directly through the application interface.
- We continuously audit benchmark transcriptions to identify potential dialectal underperformance and report edge cases to Intron Health to help advance African voice AI research.
