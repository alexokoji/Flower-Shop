import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of carriage",
  description: "The terms on which Veloxa Logistics accepts and carries consignments.",
};

const SECTIONS = [
  {
    h: "1. Acceptance",
    p: "By handing a consignment to Veloxa, or booking one through a Veloxa account, the sender accepts these terms on their own behalf and on behalf of the receiver and anyone else with an interest in the goods.",
  },
  {
    h: "2. Prohibited items",
    p: "We do not carry cash, bullion, firearms, ammunition, live animals, human remains, narcotics, or any item whose carriage is unlawful in the origin, transit or destination country. Consignments found to contain them may be surrendered to the authorities.",
  },
  {
    h: "3. Charges",
    p: "Carriage is charged at a single flat rate per shipment, published at the time of booking. The rate does not vary with weight, dimensions, destination or service level. Weight and dimensions are recorded for handling and customs purposes only, and we may re-weigh or re-measure a consignment for those purposes without affecting the price.",
  },
  {
    h: "4. Customs and duties",
    p: "The sender is responsible for the accuracy of the customs declaration. Where duties are billed to the receiver and go unpaid, the sender remains liable. Veloxa may advance duties on the customer's behalf and recover them with an administration fee.",
  },
  {
    h: "5. Delivery",
    p: "Delivery is made to the address given, not necessarily to the named person, unless a signature service was purchased. Where a receiver is unavailable, we attempt redelivery once before holding the consignment at the nearest hub for seven days.",
  },
  {
    h: "6. Liability",
    p: "Our liability for loss or damage is limited to the declared value of the consignment, or the applicable international convention limit, whichever is lower — unless insurance was purchased at booking. We are not liable for indirect or consequential loss, including loss of profit or market.",
  },
  {
    h: "7. Claims",
    p: "Claims must be notified in writing within 14 days of the delivery date, or of the date the consignment should have been delivered. Claims are not considered while charges on the consignment remain unpaid.",
  },
  {
    h: "8. Transit times",
    p: "Published transit times are business-day estimates from collection and exclude customs delays, force majeure and incorrect addresses. Time-definite commitments apply only where explicitly sold as such.",
  },
];

export default function TermsPage() {
  return (
    <div className="container-wide py-20 lg:py-28">
      <div className="max-w-3xl">
        <p className="eyebrow">Legal</p>
        <h1 className="display text-4xl lg:text-5xl text-white mt-3">Terms of carriage</h1>
        <p className="text-mist-400 text-sm mt-4">Last updated 1 January 2026</p>

        <div className="mt-12 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="display text-xl text-white">{s.h}</h2>
              <p className="text-sm text-mist-300 mt-3 leading-relaxed">{s.p}</p>
            </section>
          ))}
        </div>

        <p className="text-xs text-mist-400 mt-12 leading-relaxed">
          These terms are a summary for the purposes of this website and do not replace the signed
          carriage agreement held by account customers. Where the two differ, the signed agreement
          prevails.
        </p>
      </div>
    </div>
  );
}
