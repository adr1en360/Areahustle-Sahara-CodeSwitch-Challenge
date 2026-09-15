# AreaHustle: Responsible AI and ethics statement

## 1. Introduction

AreaHustle exists to give informal African workers voice-first digital access to gig work and fair payment. For the Sahara CodeSwitch Africa Challenge, we built the AI architecture around four commitments: protect user privacy, reduce bias against non-standard dialects, keep financial transactions transparent, and treat informal workers with dignity.

---

## 2. Audio privacy, consent, and data lifecycle

### 2.1. Explicit physical consent (zero passive listening)
- AreaHustle never uses background listening, always-on microphones, or wake-word detection.
- Audio recording starts only when the user taps the microphone button, and stops either manually or when speech ends.
- The browser microphone permission modal is shown to the user with a clear explanation of purpose.

### 2.2. Ephemeral in-memory processing
- Audio buffers uploaded to the backend are processed strictly in volatile memory.
- Audio data is transmitted securely via HTTPS/TLS 1.3 to Intron Health's Sahara STT API for transcription.
- No audio recordings are permanently stored on AreaHustle servers or local user disk. Once transcription is complete, the memory buffer is dereferenced and garbage collected.

### 2.3. No third-party audio monetization
- User voice notes are never sold, licensed, or shared with advertising networks, data brokers, or external analytics firms.

---

## 3. Linguistic equity and algorithmic inclusion

### 3.1. Reducing language and accent discrimination
- Most digital tools enforce standard British or American English, penalizing people who speak non-standard dialects or code-switch mid-sentence.
- By running Intron Sahara Voice STT, which is trained on indigenous West African phonetics and conversational Nigerian Pidgin (`pcm`), AreaHustle accepts the natural way African artisans speak. Literacy level or linguistic background does not block economic participation.

### 3.2. Error tolerance and human-in-the-loop review
- The voice pipeline automatically structures job attributes, but the system never creates a contractual obligation without human confirmation.
- The customer always reviews the structured card (Category, Budget, Location, Description) and taps "Lock Escrow" before any task is published or funds are committed.

---

## 4. Privacy and identity protection (PII safeguards)

### 4.1. Escrow-gated contact disclosure
- To protect both parties from harassment or off-platform scams, contact details (phone numbers, exact street addresses) are hidden on public job feeds.
- Contact information is unlocked only after a hustler officially accepts the gig (`status: "matched"`), so only verified counterparties in a current transaction can communicate.

### 4.2. Sensitive entity redaction
- In downstream LLM processing (Google Gemini), prompt instructions enforce the redaction of payment details, BVNs (Bank Verification Numbers), or national identification numbers from publicly visible job descriptions.

---

## 5. Economic fairness and transparent escrow

### 5.1. Transparent pricing
- All task payouts and fees are displayed in Nigerian Naira (NGN). There are no hidden fees or algorithmic price manipulation applied to workers.

### 5.2. Escrow protection against non-payment
- The primary financial risk for informal artisans is non-payment after completing work. By locking the agreed funds in escrow before dispatch, workers are guaranteed that payment exists and is waiting for them upon delivery.
- Customers can inspect the work before releasing payment, protecting them against substandard execution.

### 5.3. Portable, artisan-owned reputation
- The Financial Passport algorithm evaluates verifiable transaction signals: completion rate, repeat client ratio, and dispute-free history. This credit identity is portable, designed to help informal artisans qualify for fair institutional micro-credit without exploitative interest rates.

---

## 6. Feedback, redress, and continuous auditing

- Users can report offensive, dangerous, or illegal task postings directly through the application interface.
- We continuously audit benchmark transcriptions to identify dialectal underperformance and report edge cases to Intron Health to help advance African voice AI research.
