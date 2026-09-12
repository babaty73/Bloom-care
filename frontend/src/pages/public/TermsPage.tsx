// Trust & Launch Polish (Domain 7). Written to reflect the actual product and
// its actual limitations — not a generic template, and not a claim of
// medical authority the product does not have.

function TermsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12 text-sm leading-relaxed text-gray-700">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Terms of Service</h1>
        <p className="mt-2 text-xs text-gray-500">Plain-language terms for using Bloom-Care.</p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">What Bloom-Care is</h2>
        <p>
          Bloom-Care helps visitors find pharmacies that may have a medicine in stock, so they can decide where to go
          before traveling. Bloom-Care is not a pharmacy, does not sell or dispense medicine, and is not a medical
          provider. We do not give medical advice.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">Information may not be perfectly current</h2>
        <p>
          Medicine availability, pricing, and pharmacy details are entered and updated by pharmacies themselves.
          Every listing shows when it was last updated so you can judge its freshness, but stock, price, and hours
          can change at any time. Bloom-Care does not guarantee that a medicine shown as available will still be in
          stock, or that the listed price will be honored, when you arrive. Please call ahead or confirm with the
          pharmacy before traveling, especially for anything urgent.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">Pharmacy responsibilities</h2>
        <p>
          Pharmacies using Bloom-Care are responsible for keeping their own listed information — inventory, pricing,
          hours, and location — accurate. Providing knowingly false or misleading listings, or impersonating a
          pharmacy that does not exist, is not permitted.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">Reports and moderation</h2>
        <p>
          Visitors can report a listing they believe is inaccurate, out of date, or otherwise incorrect. Reports are
          reviewed by an administrator, who may correct or remove a listing, or take action against a pharmacy
          account as a result.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">Account suspension and removal</h2>
        <p>
          A pharmacy account found to be providing false information or otherwise violating these terms may be
          suspended or banned, which removes it and its listings from visitor search. A pharmacy account and its
          listings may also be removed entirely by an administrator.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-gray-900">Limitations</h2>
        <p>
          Bloom-Care is provided on an "as available" basis. We do our best to keep the platform running and the
          information it displays useful, but we make no guarantee that the service will be uninterrupted or that any
          listed information is complete or error-free.
        </p>
      </section>
    </div>
  );
}

export default TermsPage;
