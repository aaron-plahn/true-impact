import { Button, Typography } from "@mui/material";
import { NavMenuProps } from "./navmenu.interface";
import { Link } from "react-router-dom";

export const NavMenuMd = ({ sections, handleClose }: NavMenuProps) => {
    const flattenedItems = sections.flatMap(
        ({items}) => items
    )

  return (
    <>
      {flattenedItems.map(({ label, route }) => (
        <Button
          key={label}
          onClick={handleClose}
          sx={{ my: 2, color: "white", display: "block" }}
        >
          <Typography sx={{ textAlign: "center" }}>
            <Link to={route}>{label}</Link>
          </Typography>
        </Button>
      ))}
    </>
  );
};
