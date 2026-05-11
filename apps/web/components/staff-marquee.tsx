import Image from "next/image";
import type { AcademicStaffGroup, AcademicStaffMember } from "../lib/academic-staff";

type StaffMarqueeProps = {
  group: AcademicStaffGroup;
};

function splitMembers(members: readonly AcademicStaffMember[]) {
  const left: AcademicStaffMember[] = [];
  const right: AcademicStaffMember[] = [];

  members.forEach((member, index) => {
    if (index % 2 === 0) {
      left.push(member);
    } else {
      right.push(member);
    }
  });

  return { left, right };
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function StaffCard({ member }: { member: AcademicStaffMember }) {
  return (
    <article className="ega-staff-card">
      <div className="ega-staff-card__media">
        {member.photoSrc ? (
          <Image
            src={member.photoSrc}
            alt={`${member.name} profil fotoğrafı`}
            width={220}
            height={220}
            className="ega-staff-card__photo"
          />
        ) : (
          <div className="ega-staff-card__photo ega-staff-card__photo--placeholder" aria-hidden="true">
            <span>{initialsFromName(member.name)}</span>
          </div>
        )}
      </div>

      <div className="ega-staff-card__body">
        <strong>{member.name}</strong>
        <span>{member.title}</span>
        {member.city ? <small>{member.city}</small> : null}
      </div>
    </article>
  );
}

export function StaffMarquee({ group }: StaffMarqueeProps) {
  const { left, right } = splitMembers(group.members);
  const leftLoop = [...left, ...left];
  const rightLoop = [...right, ...right];

  return (
    <section className="ega-staff-showcase">
      <div className="ega-staff-showcase__head">
        <span className="ega-pill ega-pill--warm">{group.eyebrow}</span>
        <h2>{group.label}</h2>
        <p>{group.description}</p>
      </div>

      <div className="ega-staff-showcase__frame">
        <div className="ega-staff-marquee">
          <div className="ega-staff-marquee__column ega-staff-marquee__column--down">
            <div className="ega-staff-marquee__track">
              {leftLoop.map((member, index) => (
                <StaffCard key={`${member.id}-left-${index}`} member={member} />
              ))}
            </div>
          </div>

          <div className="ega-staff-marquee__column ega-staff-marquee__column--up">
            <div className="ega-staff-marquee__track">
              {rightLoop.map((member, index) => (
                <StaffCard key={`${member.id}-right-${index}`} member={member} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
