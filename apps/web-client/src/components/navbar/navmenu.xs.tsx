import MenuIcon from "@mui/icons-material/Menu";
import { IconButton, Typography } from "@mui/material";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Link } from "react-router-dom";
import { INavMenu, NavMenuProps } from "./navmenu.interface";

export const NavMenuXs: INavMenu = ({
  sections,
  handleClose,
  handleOpen,
  anchorEl,
}: NavMenuProps) => {
  const flattenedItems = sections.flatMap(({ items }) => items);

  return (
    <>
      <IconButton
        size="large"
        aria-label="account of current user"
        aria-controls="menu-appbar"
        aria-haspopup="true"
        onClick={handleOpen}
        color="inherit"
        data-testid="hamburger-menu"
      >
        <MenuIcon />
      </IconButton>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        {flattenedItems.map(({ label, route }) => (
          <MenuItem key={label} onClick={handleClose}>
            <Typography sx={{ textAlign: "center" }}>
              <Link to={route}>{label}</Link>
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
