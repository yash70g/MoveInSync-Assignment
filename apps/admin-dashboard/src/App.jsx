import React from "react";

const featureCards = [
  {
    title: "Create rollouts",
    description: "Draft phased releases, choose cohorts, and submit execution plans."
  },
  {
    title: "Approve releases",
    description: "Review compliance checks and approve or reject rollout requests."
  },
  {
    title: "View analytics",
    description: "Track success rate, failures, and lifecycle telemetry by cohort."
  }
];

export default function App() {
  return (
    <main className="page">
      <header className="hero">
        <h1>Admin Dashboard</h1>
        <p>Govern rollout policy, approvals, and observability.</p>
      </header>

      <section className="panel">
        <h2>Core Workflows</h2>
        <div className="grid">
          {featureCards.map((card) => (
            <article key={card.title} className="card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
