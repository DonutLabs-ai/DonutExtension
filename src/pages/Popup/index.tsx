import * as styles from "../../styles/index.module.scss";
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, MotionProps } from "framer-motion";

import {
  DonutCMDK,
  tokenRecord,
  RedCircleIcon,
  GitHubIcon,
  GreenCircleIcon,
} from "../../components";
import packageJSON from "../../../package.json";
import { connect } from "../../lib/swap";

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
