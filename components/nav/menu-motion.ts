/** Slide-and-fade for shell menus. Scoped so other dropdowns keep their own timing. */
export const menuPanelMotion =
  "w-60! min-w-52 duration-200 ease-out motion-reduce:animate-none motion-reduce:transition-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95";
