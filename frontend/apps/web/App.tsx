import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useRef,
  Component,
  type ReactNode,
} from "react";
import type { Lab } from "../../packages/core/types";
import { catalog } from "./generated/catalog";
import s from "./App.module.css";
const LabPage = lazy(() => import("./LabPage"));
class LoadBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export const labs = catalog;
const subjects: Record<string, string> = {
  math: "数学",
  physics: "物理",
  geography: "地球科学",
};
export function Brand() {
  return (
    <a href="/" className={s.brand} aria-label="Feynman 首页">
      <span className={s.mark}>
        F<span>·</span>
      </span>
      <span>
        FEYNMAN<small>THE SCIENCE OF UNDERSTANDING</small>
      </span>
    </a>
  );
}
function Header() {
  return (
    <header className={s.header}>
      <div className={s.headerInner}>
        <Brand />
        <nav aria-label="主导航">
          <a className={s.navActive} href="/">
            实验目录
          </a>
          <a href="/contribute">
            参与贡献 <span>↗</span>
          </a>
          <a
            href="https://github.com/geoochi/feynman"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </nav>
        <span className={s.edition}>中文 / CN</span>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer className={s.footer}>
      <span>
        FEYNMAN <span className={s.muted}>/ 用探索代替记忆</span>
      </span>
      <span>本地计算 · 自由探索 · 从问题开始</span>
      <a href="/contribute">一起完善这个实验室 ↗</a>
    </footer>
  );
}
export function Catalog() {
  const [subject, setSubject] = useState("all"),
    [query, setQuery] = useState("");
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const filtered = labs.filter(
    (l) =>
      (subject === "all" || l.subjects.includes(subject)) &&
      l.searchText.includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <Header />
      <main id="main" className={s.container}>
        <section className={s.hero}>
          <div>
            <p className={s.eyebrow}>
              <span className={s.statusDot} /> INTERACTIVE LEARNING LAB
            </p>
            <h1>
              让知识<span>发生。</span>
            </h1>
            <p className={s.intro}>
              有些道理，亲手试一次就懂了。
              <br />
              移动一条曲线，改变一次摆动，转动一颗星球。
              <br />
              在可操作的实验里，把「知道」变成「理解」。
            </p>
            <a className={s.heroLink} href="#catalog">
              开始一次探索 <span>↓</span>
            </a>
          </div>
          <div className={s.heroArt} aria-hidden="true">
            <svg viewBox="0 0 480 260">
              <defs>
                <pattern
                  id="heroGrid"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M24 0H0V24"
                    fill="none"
                    stroke="currentColor"
                    opacity=".12"
                  />
                </pattern>
              </defs>
              <rect x="50" width="390" height="240" fill="url(#heroGrid)" />
              <path
                d="M85 175H430M240 215V25"
                stroke="currentColor"
                opacity=".25"
              />
              <ellipse
                cx="250"
                cy="125"
                rx="145"
                ry="65"
                transform="rotate(-25 250 125)"
                fill="none"
                stroke="#0092c7"
              />
              <ellipse
                cx="250"
                cy="125"
                rx="110"
                ry="95"
                transform="rotate(30 250 125)"
                fill="none"
                stroke="#c9800f"
              />
              <circle
                cx="250"
                cy="125"
                r="38"
                fill="#ffffff"
                stroke="#6b8596"
              />
              <path d="M222 125h56m-28-28v56" stroke="#0092c7" />
              <circle cx="372" cy="61" r="7" fill="#0092c7" />
              <circle cx="154" cy="164" r="5" fill="#c9800f" />
              <text
                x="58"
                y="244"
                fontSize="10"
                fontFamily="monospace"
                fill="currentColor"
              >
                OBSERVE → QUESTION → UNDERSTAND
              </text>
            </svg>
          </div>
        </section>
        <section id="catalog" className={s.catalog} aria-label="实验目录">
          <div className={s.sectionTitle}>
            <h2>
              <span className={s.index}>01 /</span> 探索实验
            </h2>
            <span className={s.counter}>
              {labs.length.toString().padStart(2, "0")} 个可运行实验{" "}
              <span className={s.statusDot} />
            </span>
          </div>
          <div className={s.filterBar}>
            <div className={s.filters} role="group" aria-label="学科筛选">
              {[["all", "全部学科"], ...Object.entries(subjects)].map(
                ([id, name]) => (
                  <button
                    key={id}
                    aria-pressed={subject === id}
                    className={subject === id ? s.selected : ""}
                    onClick={() => setSubject(id)}
                  >
                    {name}
                    <span>
                      {id === "all"
                        ? labs.length
                        : labs.filter((l) => l.subjects.includes(id)).length}
                    </span>
                  </button>
                ),
              )}
            </div>
            <label className={s.search}>
              <span aria-hidden="true">⌕</span>
              <input
                ref={search}
                type="search"
                aria-label="搜索实验"
                placeholder="搜索知识点、实验…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>/</kbd>
            </label>
          </div>
          <p className={s.srOnly} role="status">
            找到 {filtered.length} 个实验
          </p>
          <div className={s.cardGrid}>
            {filtered.map((lab, i) => (
              <a
                href={`/labs/${lab.slug}`}
                className={s.card}
                key={lab.id}
                style={
                  {
                    "--subject-accent":
                      lab.theme === "astronomy"
                        ? "#a47a30"
                        : lab.subjects[0] === "math"
                          ? "#c9800f"
                          : "#0092c7",
                  } as React.CSSProperties
                }
              >
                <div className={s.cardPreview}>
                  <img
                    src={lab.previewUrl}
                    alt={`${lab.title["zh-CN"]}示意图`}
                    width="600"
                    height="260"
                  />
                  <span className={s.subject}>{subjects[lab.subjects[0]]}</span>
                  <span className={s.cardNumber}>
                    EXP / {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className={s.cardBody}>
                  <div className={s.cardTitle}>
                    <h3>{lab.title["zh-CN"]}</h3>
                    <span>↗</span>
                  </div>
                  <p>{lab.summary["zh-CN"]}</p>
                  <div className={s.tags}>
                    {lab.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div className={s.cardMeta}>
                    <span>{lab.estimatedMinutes} 分钟 · 实验性案例</span>
                    <strong>进入实验 →</strong>
                  </div>
                  <div className={s.cardAuthor}>
                    {lab.authors.map((a) => a.name).join(", ")}{" "}
                    <span>v{lab.version}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className={s.empty}>
              <h3>还没有找到这个实验</h3>
              <p>试试“周期”“自转”或其他知识点。</p>
              <button
                onClick={() => {
                  setQuery("");
                  setSubject("all");
                }}
              >
                清除筛选
              </button>
            </div>
          )}
        </section>
        <section className={s.community}>
          <div>
            <p className={s.eyebrow}>LEARNING IS A SHARED EXPERIMENT</p>
            <h2>
              一个好问题，
              <br />
              可以成为下一个实验。
            </h2>
          </div>
          <div>
            <p>
              我们相信，理解值得被分享。
              <br />
              从纠正一句讲解、提供一个预设开始，
              <br />
              也可以贡献你自己的可视化案例。
            </p>
            <a href="/contribute">
              了解如何参与 <span>↗</span>
            </a>
          </div>
          <span className={s.communitySymbol} aria-hidden="true">
            ＋
          </span>
        </section>
      </main>
      <Footer />
    </>
  );
}
function StaticLab({ lab, failed = false }: { lab: Lab; failed?: boolean }) {
  return (
    <>
      <Header />
      <main className={s.article}>
        <p className={s.eyebrow}>
          EXPERIMENT / {lab.subjects[0].toUpperCase()}
        </p>
        <h1>{lab.title["zh-CN"]}</h1>
        <p>{lab.summary["zh-CN"]}</p>
        <img
          className={s.articlePreview}
          src={lab.previewUrl}
          alt="实验示意图"
        />
        <p role="status">
          {failed
            ? "实验界面资源加载失败。请刷新重试，或先阅读完整讲解。"
            : "正在准备交互实验…"}
        </p>
        {failed && (
          <button onClick={() => window.location.reload()}>刷新重试</button>
        )}
        <noscript>交互实验需要启用 JavaScript。你仍可阅读完整讲解。</noscript>
        <a href={`/learn/${lab.slug}`}>阅读原理与探究指南 →</a>
      </main>
    </>
  );
}
function Learn({ lab }: { lab: Lab }) {
  return (
    <>
      <Header />
      <main id="main" className={s.article}>
        <a className={s.backLink} href={`/labs/${lab.slug}`}>
          ← 返回实验
        </a>
        <p className={s.eyebrow}>FIELD NOTES / v{lab.version}</p>
        <div
          className={s.prose}
          dangerouslySetInnerHTML={{ __html: lab.lessonHtml }}
        />
        <h2>学习目标</h2>
        <ul>
          {lab.learningObjectives.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <h2>依据与引用</h2>
        <ul>
          {lab.references.map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className={s.note}>
          实验性案例 · {lab.authors.map((a) => a.name).join(", ")} ·
          尚未完成独立教学审阅
        </p>
      </main>
      <Footer />
    </>
  );
}
function Contribute() {
  return (
    <>
      <Header />
      <main id="main" className={s.article}>
        <p className={s.eyebrow}>BUILD WITH US</p>
        <h1>
          把你的理解，
          <br />
          变成别人的起点。
        </h1>
        <p>
          Feynman
          的案例与讲解由仓库源码共同维护。你可以提出问题、纠正说明、补充预设，或实现一个新的实验。
        </p>
        <ol className={s.steps}>
          <li>
            <strong>从一个清晰问题开始</strong>
            <p>写出学习者要理解的概念，说明如何通过操作观察它。</p>
          </li>
          <li>
            <strong>在本地验证</strong>
            <p>
              案例包含独立模型、参数、讲解、预设、来源和测试。按贡献指南检查单位、边界和近似条件。
            </p>
          </li>
          <li>
            <strong>提交 Pull Request</strong>
            <p>维护者在本地审查模型与教学内容，验证后确认合并。</p>
          </li>
        </ol>
        <a
          className={s.primaryLink}
          href="https://github.com/geoochi/feynman/blob/main/docs/CONTRIBUTING_DESIGN.md"
          target="_blank"
          rel="noreferrer"
        >
          查看完整贡献指南 ↗
        </a>
        <p className={s.note}>
          仓库目前为私有，访问需要仓库权限。对外开放与许可证尚待维护者确认。
        </p>
      </main>
      <Footer />
    </>
  );
}
export function App({ path }: { path: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const clean = path.replace(/\/$/, "") || "/";
  const match = clean.match(/^\/(labs|learn)\/([a-z0-9-]+)$/);
  const lab = match && labs.find((l) => l.slug === match[2]);
  if (clean === "/") return <Catalog />;
  if (clean === "/contribute") return <Contribute />;
  if (lab && match)
    return match[1] === "learn" ? (
      <Learn lab={lab} />
    ) : mounted ? (
      <LoadBoundary fallback={<StaticLab lab={lab} failed />}>
        <Suspense fallback={<StaticLab lab={lab} />}>
          <LabPage lab={lab} />
        </Suspense>
      </LoadBoundary>
    ) : (
      <StaticLab lab={lab} />
    );
  return (
    <>
      <Header />
      <main className={s.article}>
        <p className={s.eyebrow}>404 / OUTSIDE THE LAB</p>
        <h1>这个实验还不存在。</h1>
        <p>从目录选择一个问题，重新开始探索。</p>
        <a href="/">返回实验目录 →</a>
      </main>
    </>
  );
}
