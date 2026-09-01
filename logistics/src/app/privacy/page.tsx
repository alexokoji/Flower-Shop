import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Veloxa Logistics handles the personal data attached to a shipment.",
};

const SECTIONS = [
  {
    h: "What we hold",
    p: "For each consignment we hold the sender's and receiver's name, address, phone number and email, a description of the contents, and the scan history of the shipment. Account holders additionally have login credentials and billing records.",
  },
  {
    h: "What tracking shows publicly",
    p: "Anyone holding a tracking number can see the shipment's status, the origin and destination city and country, partially masked names, and the timeline of scans. Street addresses, phone numbers, email addresses, contents and prices are never shown on the public tracking page.",
  },
  {
    h: "Receipt links",
    p: "A receipt link contains a long random token and shows the full consignment record, including addresses and charges. Treat it like a document: anyone you send it to can open it. Contact us if a link needs to be revoked.",
  },
  {
    h: "Why we hold it",
    p: "To carry out the contract of carriage, to clear customs, to bill for the service, and to meet the record-keeping obligations of a licensed carrier. We do not sell personal data, and we do not use consignment data for advertising.",
  },
  {
    h: "Who we share it with",
    p: "Customs authorities, our partner carriers on the relevant leg, and payment providers processing your transaction. Each receives only what that role requires.",
  },
  {
    h: "How long we keep it",
    p: "Consignment records are retained for seven years to satisfy customs and tax requirements. Account records are deleted on request once no consignment remains within that window.",
  },
  {
    h: "Your rights",
    p: "You may request a copy of the data we hold about you, ask us to correct it, or ask for deletion where no legal obligation requires us to keep it. Write to privacy@veloxa.com and we will respond within 30 days.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-wide py-20 lg:py-28">
      <div className="max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="display text-4xl lg:text-5xl text-white mt-3">Privacy policy</h1>
        <p className="text-mist-400 text-sm mt-4">Last updated 1 January 2026</p>

        <div className="mt-12 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="display text-xl text-white">{s.h}</h2>
              <p className="text-sm text-mist-300 mt-3 leading-relaxed">{s.p}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
