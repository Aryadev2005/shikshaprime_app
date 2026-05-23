import Image from "next/image";
import "./profile.css";

const accountInfo = [
  { label: "User Name", value: "Admin" },
  { label: "Email", value: "admin@shikshaprime.com" },
  { label: "User Type", value: "Admin" },
];

const roleCards = [
  {
    title: "Student",
    count: "5k",
    image: "/images/profile/student-icon.svg",
    alt: "Student profile icon",
  },
  {
    title: "Teacher",
    count: "99.",
    image: "/images/profile/teacher-icon.svg",
    alt: "Teacher profile icon",
  },
];

export default function Page() {
  return (
    <section className="min-h-screen admin-profile">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="rounded-[28px] bg-gradient-to-r from-[#edf2fb] via-[#edf2fb] to-[#e4ebf7] px-5 py-6 shadow-[0_18px_45px_rgba(107,129,167,0.14)] sm:px-7 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.95fr)]">
              <div className="flex h-full flex-col">
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#1f2432] sm:text-[2.25rem]">
                  Welcome in, Ramesh Das
                </h1>

                <div className="mt-6 space-y-4">
                  {accountInfo.map((item) => (
                    <div
                      key={item.label}
                      className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-4 text-sm sm:grid-cols-[128px_minmax(0,1fr)] sm:text-[15px]"
                    >
                      <span className="font-medium text-[#788296]">
                        {item.label}:
                      </span>
                      <span className="font-semibold text-[#242a37] break-all">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#f5b100] to-[#f26b4a] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(242,107,74,0.28)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(242,107,74,0.32)]"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] bg-white/55 p-4 shadow-[0_10px_24px_rgba(98,120,152,0.12)] backdrop-blur-[2px]">
                <div className="grid gap-4 sm:grid-cols-2">
                  {roleCards.map((card) => (
                    <article
                      key={card.title}
                      className="flex min-h-[230px] flex-col items-center rounded-[20px] bg-white px-5 py-6 text-center shadow-[0_12px_30px_rgba(105,124,154,0.14)]"
                    >
                      <h2 className="text-[1.35rem] font-medium text-[#1f2432]">
                        {card.title}
                      </h2>

                      <div className="relative mt-6 flex h-[112px] w-[112px] items-center justify-center rounded-full border border-[#f28f78] bg-[#fff9f6] shadow-[inset_0_0_0_6px_#ffffff]">
                        <Image
                          src={card.image}
                          alt={card.alt}
                          width={74}
                          height={74}
                          className="h-[74px] w-[74px] object-contain"
                        />
                        <span className="absolute bottom-0 right-0 inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#f26b4a] px-2 text-sm font-bold text-white shadow-[0_8px_18px_rgba(242,107,74,0.35)]">
                          {card.count}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <article className="flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_12px_30px_rgba(105,124,154,0.14)]">
              <div className="flex min-h-[220px] items-center justify-center bg-gradient-to-b from-[#ffffff] to-[#f9fbff] p-6">
                <Image
                  src="/images/profile/updates-icon.svg"
                  alt="College emblem"
                  width={170}
                  height={170}
                  className="h-auto w-full max-w-[170px] object-contain"
                />
              </div>

              <div className="flex items-center justify-between border-t border-[#e6ebf3] px-5 py-4">
                <p className="text-base font-semibold text-[#1e2433]">
                  St. Xavier&apos;s College
                </p>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1ec] text-[#ef704c] shadow-[inset_0_0_0_1px_#ffd6c9]">
                  &#10227;
                </span>
              </div>
            </article>
          </div>
        </div>

        <footer className="rounded-2xl bg-white px-4 py-3 text-xs text-[#8b94a6] shadow-[0_10px_24px_rgba(98,120,152,0.08)]">
          Copyright © 2026, by BitExtreme Technology Solution Pvt. Ltd
        </footer>
      </div>
    </section>
  );
}
