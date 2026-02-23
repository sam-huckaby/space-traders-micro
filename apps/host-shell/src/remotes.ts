import type { RemoteModule } from "@deck/contracts";

export async function loadRemote(name: "session" | "fleet" | "map" | "contracts") {
  switch (name) {
    case "session":
      return (await import("session/remote")).default as RemoteModule;
    case "fleet":
      return (await import("fleet/remote")).default as RemoteModule;
    case "map":
      return (await import("map/remote")).default as RemoteModule;
    case "contracts":
      return (await import("contracts/remote")).default as RemoteModule;
  }
}
