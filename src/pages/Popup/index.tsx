import * as styles from "../../styles/index.module.scss";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion, MotionProps } from "framer-motion";

import {
  DonutCMDK,
  DonutIcon,
  tokenRecord,
  RedCircleIcon,
  GitHubIcon,
  GreenCircleIcon,
} from "../../components";
import packageJSON from "../../../package.json";
import { connect } from "../../lib/swap";

type TTheme = {
  theme: Themes;
  setTheme: Function;
};

type Themes = "donut";

const ThemeContext = React.createContext<TTheme>({} as TTheme);

export default function Index() {
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
        <CMDKWrapper key="donut">
          <DonutCMDK tokenList={tokenRecord} />
        </CMDKWrapper>
        <div aria-hidden className={styles.line} />
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
  const [copied, setStatus] = useState(false);

  return (
    <button
      className={styles.installButton}
      onClick={async () => {
        try {
          let res = await connect();
          setStatus(res);
        } catch (e) {}
      }}
    >
      connect wallet to donut 🍩
      <span>{copied ? <GreenCircleIcon /> : <RedCircleIcon />}</span>
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
    icon: <DonutIcon />,
    key: "donut",
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
