import type { Metadata } from "next";
import Link from "next/link";
import { StatusDot } from "@kimono/ui";
import { AppShell } from "@/components/app-shell";
import { AppIcon, ChevronIcon, GridIcon, PeopleIcon, SettingsIcon } from "@/components/icons";
import { applications, householdMembers } from "@/lib/registry";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Household settings" };

const sections = [
  { id: "overview", label: "Overview", icon: SettingsIcon },
  { id: "people", label: "People & access", icon: PeopleIcon },
  { id: "apps", label: "Applications", icon: GridIcon },
  { id: "identity", label: "Sign-in & identity", icon: PeopleIcon },
  { id: "system", label: "System", icon: SettingsIcon },
] as const;

type Section = typeof sections[number]["id"];

function SetupCallout() {
  return (
    <div className="setup-callout">
      <div className="setup-callout-icon">!</div>
      <div><strong>Kimono is not fully configured</strong><p>Finish identity, storage, and application setup before inviting the rest of your household.</p></div>
      <Link href="/admin?section=identity" className="secondary-action">Continue setup <ChevronIcon /></Link>
    </div>
  );
}

function Overview() {
  const ready = applications.filter((app) => app.status !== "setup").length;
  return <>
    <SetupCallout />
    <section className="admin-block">
      <div className="block-heading"><div><p className="eyebrow">At a glance</p><h2>Household health</h2></div><span className="quiet-badge"><StatusDot status="degraded" /> Setup in progress</span></div>
      <div className="stat-grid">
        <Link href="/admin?section=people" className="stat-card"><span>People</span><strong>{householdMembers.length}</strong><small>1 invitation pending</small><ChevronIcon /></Link>
        <Link href="/admin?section=apps" className="stat-card"><span>Applications</span><strong>{ready}<i> / {applications.length}</i></strong><small>{applications.length - ready} need setup</small><ChevronIcon /></Link>
        <Link href="/admin?section=identity" className="stat-card"><span>Identity</span><strong className="stat-word">Connected</strong><small>Authentik OIDC</small><ChevronIcon /></Link>
      </div>
    </section>
    <section className="admin-block">
      <div className="block-heading"><div><p className="eyebrow">Next steps</p><h2>Setup checklist</h2></div><span>2 of 5 complete</span></div>
      <div className="check-list">
        <div className="check-row complete"><span className="check">✓</span><span><strong>Connect identity provider</strong><small>Authentik is issuing household sessions.</small></span><span>Complete</span></div>
        <div className="check-row complete"><span className="check">✓</span><span><strong>Create owner account</strong><small>Your owner account can manage this household.</small></span><span>Complete</span></div>
        <Link href="/admin?section=people" className="check-row"><span className="check">3</span><span><strong>Review household access</strong><small>Confirm roles before sending invitations.</small></span><ChevronIcon /></Link>
        <Link href="/admin?section=apps" className="check-row"><span className="check">4</span><span><strong>Configure remaining apps</strong><small>Drive and Tools are not available yet.</small></span><ChevronIcon /></Link>
        <Link href="/admin?section=system" className="check-row"><span className="check">5</span><span><strong>Set backup destination</strong><small>No household backup has been configured.</small></span><ChevronIcon /></Link>
      </div>
    </section>
  </>;
}

function People() {
  return <section className="admin-block first-block">
    <div className="block-heading"><div><p className="eyebrow">Accounts & roles</p><h2>People</h2><p>Control who belongs to the household and what they can open.</p></div><button className="primary-action" type="button" disabled title="Invitations require email setup">Invite person</button></div>
    <div className="notice-line"><span>i</span> Invitations stay disabled until outbound email is configured.</div>
    <div className="data-list">
      {householdMembers.map((member) => <div className="data-row person-row" key={member.handle}>
        <span className="avatar soft">{member.name.at(0)}</span><span className="row-primary"><strong>{member.name}</strong><small>{member.handle}</small></span>
        <span className="role-badge">{member.role}</span><span className="row-meta">{member.apps} apps</span><span className="row-status"><span className={member.status === "Active" ? "member-state active" : "member-state"} />{member.status}</span><button type="button" className="row-menu" aria-label={`Manage ${member.name}`}>•••</button>
      </div>)}
    </div>
    <div className="permission-note"><strong>Access is role-based</strong><p>Owners manage everything. Admins manage people and apps. Members only see apps assigned to them. Guests have limited access.</p></div>
  </section>;
}

function Applications() {
  return <section className="admin-block first-block">
    <div className="block-heading"><div><p className="eyebrow">Household services</p><h2>Applications</h2><p>Availability, access, and connection status for every household app.</p></div><button className="primary-action" type="button" disabled title="Custom app registration is not implemented">Add application</button></div>
    <div className="data-list app-admin-list">
      {applications.map((app) => <div className="data-row app-row" key={app.id} style={{ "--app-accent": app.accent } as React.CSSProperties}>
        <span className="mini-app-icon"><AppIcon app={app} /></span><span className="row-primary"><strong>{app.name}</strong><small>{app.shortDescription}</small></span>
        <span className="row-status"><StatusDot status={app.status} />{app.status === "setup" ? "Needs setup" : app.status}</span>
        <span className="access-copy">{app.visibleTo.length} roles</span><button type="button" className="row-action">{app.status === "setup" ? "Configure" : "Manage"}<ChevronIcon /></button>
      </div>)}
    </div>
  </section>;
}

function Identity() {
  return <>
    <section className="admin-block first-block"><div className="block-heading"><div><p className="eyebrow">Authentication</p><h2>Sign-in & identity</h2><p>Kimono currently delegates account security to your identity provider.</p></div><span className="quiet-badge"><StatusDot status="online" /> Connected</span></div>
      <div className="settings-card"><div className="provider-mark">A</div><div><strong>Authentik</strong><small>OpenID Connect · Household identity provider</small></div><span className="provider-domain">auth.kimono.local</span><button className="secondary-action" type="button">Review</button></div>
    </section>
    <section className="admin-block"><div className="block-heading"><div><p className="eyebrow">Required before invitations</p><h2>Outbound email</h2></div><span className="warning-badge">Not configured</span></div><div className="empty-config"><span>✉</span><div><strong>No email provider</strong><p>Add SMTP details to send invitations, password notices, and service alerts.</p></div><button className="primary-action" type="button">Configure SMTP</button></div></section>
  </>;
}

function System() {
  return <>
    <section className="admin-block first-block"><div className="block-heading"><div><p className="eyebrow">This installation</p><h2>System</h2><p>Infrastructure status and household data protection.</p></div></div><div className="setting-rows"><div><span><strong>Portal</strong><small>Version 0.1.0</small></span><span className="row-status"><StatusDot status="online" /> Healthy</span></div><div><span><strong>Public address</strong><small>Where household members reach Kimono</small></span><code>kimono.local</code></div><div><span><strong>Updates</strong><small>Automatic updates are off</small></span><button className="text-action">Check now</button></div></div></section>
    <section className="admin-block"><div className="block-heading"><div><p className="eyebrow">Data protection</p><h2>Backups</h2></div><span className="warning-badge">Action required</span></div><div className="empty-config"><span>↥</span><div><strong>No backup destination</strong><p>Choose a destination before storing important household files.</p></div><button className="primary-action" type="button">Set up backup</button></div></section>
  </>;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "owner" && session.user.role !== "admin") redirect("/");
  const params = await searchParams;
  const section = sections.some((item) => item.id === params.section) ? params.section as Section : "overview";
  const displayName = session.user.name?.split(" ")[0] || session.user.username || "Kimono";
  const content = section === "people" ? <People /> : section === "apps" ? <Applications /> : section === "identity" ? <Identity /> : section === "system" ? <System /> : <Overview />;

  return <AppShell active="admin" profile={{ displayName, role: session.user.role }}><div className="admin-layout">
    <aside className="admin-sidebar"><div className="admin-sidebar-title"><span>管</span><div><strong>Household</strong><small>Settings</small></div></div><nav aria-label="Settings sections">{sections.map((item) => { const Icon = item.icon; return <Link key={item.id} href={item.id === "overview" ? "/admin" : `/admin?section=${item.id}`} className={section === item.id ? "active" : ""}><Icon /><span>{item.label}</span>{item.id === "identity" || item.id === "system" ? <i /> : null}</Link>; })}</nav><p className="sidebar-note">Kimono<br />Household OS<br /><span>v0.1.0</span></p></aside>
    <div className="admin-content"><header className="admin-topline"><div><p className="eyebrow">Administration</p><h1>{sections.find((item) => item.id === section)?.label}</h1></div><div className="hanko small">家</div></header>{content}</div>
  </div></AppShell>;
}
