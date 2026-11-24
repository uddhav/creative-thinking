// Container entrypoint. Starts as root only long enough to make the data
// directory writable, then drops to the unprivileged `node` user and starts
// the server in this same process, so it stays PID 1 and gets SIGTERM.
//
// Why: a fresh volume (Fly, some Docker volume drivers, Kubernetes without
// fsGroup) mounts owned by root, so a server that starts as `node` cannot
// write to it and persistence fails on the first save.
//
// Plain Node rather than su-exec or gosu: nothing to install, nothing to keep
// patched. Started as a non-root user already (`docker run --user node`), it
// changes nothing and just starts the server.

import { chownSync, mkdirSync, statSync } from 'node:fs';

const NODE_UID = 1000;
const NODE_GID = 1000;

if (process.getuid?.() === 0) {
  if (process.env.PERSISTENCE_TYPE === 'filesystem') {
    const dir = process.env.PERSISTENCE_PATH || '/data/creative-thinking';
    mkdirSync(dir, { recursive: true });
    if (statSync(dir).uid !== NODE_UID) {
      // The store directory is enough: the server creates everything under
      // it after the drop below, so those files are already its own.
      chownSync(dir, NODE_UID, NODE_GID);
    }
  }
  // Order matters: groups and gid while still root, uid last.
  process.initgroups('node', NODE_GID);
  process.setgid(NODE_GID);
  process.setuid(NODE_UID);
  process.env.HOME = '/home/node';
  process.env.USER = 'node';
}

await import('/app/dist/mcp-server-main.js');
