import * as styles from "../../styles/index.module.scss";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion, MotionProps, useInView } from "framer-motion";

import {
  FramerCMDK,
  LinearCMDK,
  LinearIcon,
  VercelCMDK,
  VercelIcon,
  RaycastCMDK,
  RaycastIcon,
  CopyIcon,
  FramerIcon,
  GitHubIcon,
  Code,
  CopiedIcon,
} from "../../components";
import packageJSON from "../../../package.json";

type TTheme = {
  theme: Themes;
  setTheme: Function;
};

type Themes = "linear" | "raycast" | "vercel" | "framer";

const ThemeContext = React.createContext<TTheme>({} as TTheme);

export default function Index() {
  const [theme, setTheme] = useState<Themes>("raycast");

  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <div className={styles.meta}>
          <div className={"style-info"}>
            <VersionBadge />
            <h1>🍩</h1>
            <p>Executable Command Bar</p>
          </div>

          <div className={styles.buttons}>
            <InstallButton />
            <GitHubButton />
          </div>
        </div>

        <AnimatePresence exitBeforeEnter initial={false}>
          {theme === "framer" && (
            <CMDKWrapper key="framer">
              <FramerCMDK />
            </CMDKWrapper>
          )}
          {theme === "vercel" && (
            <CMDKWrapper key="vercel">
              <VercelCMDK />
            </CMDKWrapper>
          )}
          {theme === "linear" && (
            <CMDKWrapper key="linear">
              <LinearCMDK />
            </CMDKWrapper>
          )}
          {theme === "raycast" && (
            <CMDKWrapper key="raycast">
              <RaycastCMDK />
            </CMDKWrapper>
          )}
        </AnimatePresence>

        <ThemeContext.Provider value={{ theme, setTheme }}>
          <ThemeSwitcher />
        </ThemeContext.Provider>

        <div aria-hidden className={styles.line} />

        <Codeblock />
      </div>
    </main>
  );
}

function CMDKWrapper(props: MotionProps & { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      style={{
        height: 475,
      }}
      {...props}
    />
  );
}

//////////////////////////////////////////////////////////////////

function InstallButton() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      className={styles.installButton}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(`donut 🍩`);
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        } catch (e) {}
      }}
    >
      donut 🍩
      <span>{copied ? <CopiedIcon /> : <CopyIcon />}</span>
    </button>
  );
}

function GitHubButton() {
  return (
    <a
      href="https://github.com/DonutLabs-ai/DonutExtension"
      target="_blank"
      rel="noopener noreferrer"
      className={styles.githubButton}
    >
      <GitHubIcon />
      Donut Extension
    </a>
  );
}

//////////////////////////////////////////////////////////////////

const themes = [
  {
    icon: <RaycastIcon />,
    key: "raycast",
  },
  {
    icon: <LinearIcon />,
    key: "linear",
  },
  {
    icon: <VercelIcon />,
    key: "vercel",
  },
  {
    icon: <FramerIcon />,
    key: "framer",
  },
];

function ThemeSwitcher() {
  const { theme, setTheme } = React.useContext(ThemeContext);
  const ref = React.useRef<HTMLButtonElement | null>(null);
  const [showArrowKeyHint, setShowArrowKeyHint] = useState(false);

  React.useEffect(() => {
    function listener(e: KeyboardEvent) {
      const themeNames = themes.map((t) => t.key);

      if (e.key === "ArrowRight") {
        const currentIndex = themeNames.indexOf(theme);
        const nextIndex = currentIndex + 1;
        const nextItem = themeNames[nextIndex];

        if (nextItem) {
          setTheme(nextItem);
        }
      }

      if (e.key === "ArrowLeft") {
        const currentIndex = themeNames.indexOf(theme);
        const prevIndex = currentIndex - 1;
        const prevItem = themeNames[prevIndex];

        if (prevItem) {
          setTheme(prevItem);
        }
      }
    }

    document.addEventListener("keydown", listener);

    return () => {
      document.removeEventListener("keydown", listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return (
    <div className={styles.switcher}>
      <motion.span
        className={styles.arrow}
        initial={false}
        animate={{
          opacity: showArrowKeyHint ? 1 : 0,
          x: showArrowKeyHint ? -24 : 0,
        }}
        style={{
          left: 100,
        }}
      >
        ←
      </motion.span>
      {themes.map(({ key, icon }) => {
        const isActive = theme === key;
        return (
          <button
            ref={ref}
            key={key}
            data-selected={isActive}
            onClick={() => {
              setTheme(key);
              if (showArrowKeyHint === false) {
                setShowArrowKeyHint(true);
              }
            }}
          >
            {icon}
            {key}
            {isActive && (
              <motion.div
                layoutId="activeTheme"
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 27,
                  mass: 1,
                }}
                className={styles.activeTheme}
              />
            )}
          </button>
        );
      })}
      <motion.span
        className={styles.arrow}
        initial={false}
        animate={{
          opacity: showArrowKeyHint ? 1 : 0,
          x: showArrowKeyHint ? 20 : 0,
        }}
        style={{
          right: 100,
        }}
      >
        →
      </motion.span>
    </div>
  );
}
//////////////////////////////////////////////////////////////////

function Codeblock() {
  const code = `import { Command } from 'cmdk';

<Command.Dialog open={open} onOpenChange={setOpen}>
  <Command.Input />

  <Command.List>
    {loading && <Command.Loading>Hang on…</Command.Loading>}

    <Command.Empty>No results found.</Command.Empty>

    <Command.Group heading="Fruits">
      <Command.Item>Apple</Command.Item>
      <Command.Item>Orange</Command.Item>
      <Command.Separator />
      <Command.Item>Pear</Command.Item>
      <Command.Item>Blueberry</Command.Item>
    </Command.Group>

    <Command.Item>Fish</Command.Item>
  </Command.List>
</Command.Dialog>`;

  return (
    <div className={styles.codeBlock}>
      <div className={styles.line2} aria-hidden />
      <div className={styles.line3} aria-hidden />
      <Code>{code}</Code>
    </div>
  );
}

//////////////////////////////////////////////////////////////////

function VersionBadge() {
  return <span className={styles.versionBadge}>v{packageJSON.version}</span>;
}

const container = document.getElementById("app-container");

if (container) {
  const root = createRoot(container);
  root.render(<Index />);
} else {
  console.error("no container");
}
