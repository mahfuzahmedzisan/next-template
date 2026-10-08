import videojs from "video.js";
import type Player from "video.js/dist/types/player";

type QualityLevel = {
  height: number;
  bitrate: number;
  enabled: boolean;
};

type QualityLevelList = {
  length: number;
  [index: number]: QualityLevel;
  on(event: string, handler: () => void): void;
  off(event: string, handler: () => void): void;
};

type PlayerWithLevels = Player & {
  qualityLevels?: () => QualityLevelList;
};

const MenuButton = videojs.getComponent("MenuButton");
const MenuItem = videojs.getComponent("MenuItem");

class QualityMenuItem extends MenuItem {
  handleClick() {
    const list = levelsOf(this.player());
    const index = this.options_.levelIndex as number | "auto";
    if (!list) return;

    for (let i = 0; i < list.length; i++) {
      list[i].enabled = index === "auto" || i === index;
    }

    const button = this.player().getChild("controlBar")?.getChild("QualityMenuButton");
    (button as { update?: () => void } | undefined)?.update?.();
  }
}

class QualityMenuButton extends MenuButton {
  private refresh = () => {
    (this as unknown as { update: () => void }).update();
  };

  constructor(player: Player, options?: Record<string, unknown>) {
    super(player, options);
    (this as unknown as { controlText: (text: string) => void }).controlText("Quality");
    this.addClass("vjs-quality-menu-button");

    const list = levelsOf(player);
    list?.on("addqualitylevel", this.refresh);
    list?.on("change", this.refresh);
  }

  dispose() {
    const list = levelsOf(this.player());
    list?.off("addqualitylevel", this.refresh);
    list?.off("change", this.refresh);
    super.dispose();
  }

  createItems() {
    const list = levelsOf(this.player());
    if (!list || list.length === 0) return [];

    const enabled = Array.from({ length: list.length }, (_, index) => list[index].enabled);
    const auto = enabled.every(Boolean);
    const items = [
      new QualityMenuItem(this.player(), {
        label: "Auto",
        levelIndex: "auto",
        selectable: true,
        selected: auto,
      } as never),
    ];

    const ranked = Array.from({ length: list.length }, (_, index) => ({
      index,
      height: list[index].height,
      bitrate: list[index].bitrate,
    })).sort((a, b) => b.height - a.height || b.bitrate - a.bitrate);

    for (const level of ranked) {
      const label = level.height > 0 ? `${level.height}p` : `${Math.round(level.bitrate / 1000)} kbps`;
      items.push(
        new QualityMenuItem(this.player(), {
          label,
          levelIndex: level.index,
          selectable: true,
          selected: !auto && list[level.index].enabled,
        } as never),
      );
    }

    const current = auto
      ? "Auto"
      : (items.find((item) => item.options_.selected)?.options_.label as string | undefined) ?? "HD";
    const placeholder = this.el().querySelector(".vjs-icon-placeholder");
    placeholder?.setAttribute("data-quality", current);

    return items;
  }
}

function levelsOf(player: Player): QualityLevelList | null {
  const candidate = player as PlayerWithLevels;
  return typeof candidate.qualityLevels === "function" ? candidate.qualityLevels() : null;
}

let registered = false;

export function registerQualityMenu() {
  if (registered) return;
  videojs.registerComponent("QualityMenuButton", QualityMenuButton);
  registered = true;
}
