const lastSeenAt = "2026-05-12 13:06:49.827864+00";
const lastSeen = new Date(lastSeenAt).getTime();
const now = Date.now();
const diff = now - lastSeen;
const grace = 300000;

console.log("Last Seen At String:", lastSeenAt);
console.log("Last Seen Timestamp:", lastSeen);
console.log("Now Timestamp:", now);
console.log("Diff (ms):", diff);
console.log("Diff (min):", diff / 1000 / 60);
console.log("Is Online:", diff < grace);
