import Image from "next/image";
import type { AcademicStaffGroup, AcademicStaffMember } from "../lib/academic-staff";
import { isDirectVideoUrl, normalizeVideoEmbedUrl } from "../lib/media-url";

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

function StaffIntroVideo({ group }: { group: AcademicStaffGroup }) {
  const title = group.introVideoTitle?.trim() || `${group.label} tanıtım videosu`;
  const videoUrl = group.introVideoUrl?.trim();
  const normalizedVideoUrl = videoUrl ? normalizeVideoEmbedUrl(videoUrl) : "";

  if (!videoUrl) {
    return (
      <div className="ega-staff-video-box" data-has-video="false">
        <div className="ega-staff-video-box__placeholder">
          <span className="ega-staff-video-box__eyebrow">Video</span>
          <strong>{title}</strong>
        </div>
      </div>
    );
  }

  if (group.introVideoSourceType === "DIRECT" || isDirectVideoUrl(normalizedVideoUrl)) {
    return (
      <div className="ega-staff-video-box" data-has-video="true">
        <video
          className="ega-staff-video-box__media"
          controls
          playsInline
          preload="metadata"
          poster={group.introVideoPosterUrl}
        >
          <source src={normalizedVideoUrl} />
          Tarayıcınız bu videoyu oynatamıyor.
        </video>
      </div>
    );
  }

  return (
    <div className="ega-staff-video-box" data-has-video="true">
      <iframe
        className="ega-staff-video-box__media"
        src={normalizedVideoUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
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

      <StaffIntroVideo group={group} />

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
