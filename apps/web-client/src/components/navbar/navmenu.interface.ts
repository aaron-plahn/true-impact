import React, { JSX } from "react";

interface LabelAndRoute {
  label: string;
  route: string;
}

export interface NavMenuSection {
  label: string;
  items: LabelAndRoute[];
}

export interface NavMenuProps {
  sections: NavMenuSection[];
  handleOpen: (event: React.MouseEvent<HTMLElement>) => void;
  handleClose: (event: React.MouseEvent<HTMLElement>) => void;
  anchorEl: HTMLElement | null;
}

export interface INavMenu {
  (props: NavMenuProps): JSX.Element;
}
