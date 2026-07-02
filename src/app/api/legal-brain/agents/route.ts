import { NextResponse } from "next/server";
import { AGENTS, getDomains, DOMAIN_LABELS } from "@/lib/legal-brain/registry";

export async function GET() {
  const domains = getDomains();
  const agentsByDomain = domains.map((d) => ({
    domain: d,
    label: DOMAIN_LABELS[d],
    agents: AGENTS.filter((a) => a.domain === d),
  }));

  return NextResponse.json({
    success: true,
    total_agents: AGENTS.length,
    domains: domains.length,
    agents_by_domain: agentsByDomain,
  });
}
