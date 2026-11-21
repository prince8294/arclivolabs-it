export function MarqueeSection() {
  const technologies = ["Next.js", "React", "TypeScript", "Node.js", "MongoDB", "Tailwind CSS", "Shopify", "Figma", "REST APIs"];
  return (
    <section aria-label="Technologies we work with" className="marquee-section">
      <div aria-hidden="true" className="marquee-track">
        {[0, 1].map((copy) => (
          <div className="marquee-track__group" key={copy}>
            {technologies.map((technology) => (
              <span key={`${copy}-${technology}`}>{technology}<i /></span>
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">
        Next.js, React, TypeScript, Node.js, MongoDB, Tailwind CSS, Shopify, Figma, REST APIs.
      </span>
    </section>
  );
}
