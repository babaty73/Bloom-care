// Trust & Launch Polish (Domain 7). Written to accurately describe what this
// specific application actually does, based on the real implementation —
// not a generic template. No company/legal entity, address, or contact
// method is invented; none exists in the project. No compliance framework
// (GDPR/CCPA/etc.) is claimed, since none has been established for this
// project.

function PrivacyPolicyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12 text-sm leading-relaxed text-gray-700">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-xs text-gray-500">
          This page explains what information Bloom-Care collects and how it is used. It is written in plain
          language rather than as a formal legal document.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">Visitors searching for medicine</h2>
        <p>
          You do not need an account to search for medicine or view pharmacy information on Bloom-Care. We do not
          require you to provide any personal information to use search.
        </p>
        <p>
          If you use the "Find Nearby Pharmacies" feature, your device's location is requested by your browser and
          sent to our server only to calculate distances to pharmacies for that one search. It is not stored on our
          servers and is not attached to any profile — it exists only for the duration of that request.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">Reporting incorrect information</h2>
        <p>
          Anyone can report incorrect medicine or pharmacy information without creating an account. A report includes
          the reason you selected, any additional comment you write, and which medicine listing and pharmacy it
          concerns. We do not collect your name, email, or any other identifying information as part of a report.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">Pharmacy accounts</h2>
        <p>Pharmacies that register on Bloom-Care provide:</p>
        <ul className="list-disc pl-5">
          <li>Pharmacy name, address, phone number, and email address</li>
          <li>A password, which we store only as a securely hashed value — never in plain text</li>
          <li>A Google Maps link to their location, which we use to determine an approximate latitude/longitude so
            visitors can see distance to your pharmacy</li>
          <li>Opening and closing hours, and an optional logo</li>
          <li>The medicines they choose to list, including name, price, quantity, and expiration date</li>
        </ul>
        <p>
          This information is used to operate the pharmacy's public listing (so visitors can find and contact them)
          and their private dashboard (so the pharmacy can manage their own inventory and profile).
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">Sessions and authentication</h2>
        <p>
          When a pharmacy or admin logs in, a login token is stored in your browser's local storage to keep you
          signed in. We do not use tracking cookies. Logging out removes this token from your browser.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">Sharing of information</h2>
        <p>
          We do not sell or share personal information with advertisers. The only outside service we send data to is
          a location-lookup service, used solely to convert a pharmacy's Google Maps link into an approximate
          location when that pharmacy registers or updates its location — no visitor data is sent to this service.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">Questions about this policy</h2>
        <p>
          Bloom-Care does not yet have a dedicated privacy contact channel. This page will be updated with contact
          details once one is available.
        </p>
      </section>
    </div>
  );
}

export default PrivacyPolicyPage;
