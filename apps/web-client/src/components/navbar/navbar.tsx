import { JSX, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import AdbIcon from "@mui/icons-material/Adb";
import { NavMenuSection } from "./navmenu.interface";
import { NavMenuXs } from "./navmenu.xs";
import { NavMenuMd } from "./navmenu.md";
import { MenuItem } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LoginIcon from "@mui/icons-material/Login";
import { useSessionContext } from "supertokens-auth-react/recipe/session";
import { Loading } from "../loading";
import { signOut } from "supertokens-web-js/recipe/emailpassword";

const surveyMenu: NavMenuSection = {
  label: "Surveys",
  items: [
    {
      label: "Complete a Survey",
      route: "/surveys/complete",
    },
    {
      label: "Review a Survey",
      route: "/surveys/review",
    },
    {
      label: "Build a Survey",
      route: "/surveys/manage",
    },
  ],
};

const _clientMenu: NavMenuSection = {
  label: "Clients",
  items: [
    {
      label: "Clients",
      route: "/clients",
    },
  ],
};

const publicSettings: NavMenuSection = {
  label: "Sign In",
  items: [
    {
      label: "Sign In",
      route: "/auth",
    },
  ],
};

export const NavBar = (): JSX.Element => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const session = useSessionContext();

  async function logOutWithRedirect() {
    await signOut();

    navigate("/");
  }

  if (session.loading) {
    return <Loading />;
  }

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNavMenu = (_event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(null);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // return (
  //   <nav className="nav-bar">
  //     <div className="nav-bar-left">
  //       <Link to="/" className="logo">True Impact</Link>
  //     </div>
  //     <ul className="nav-menu">
  //       <li>
  //         <NavLink to="/">Home</NavLink>
  //       </li>
  //       <li>
  //         <NavLink to="/surveys/complete">Complete a Survey</NavLink>
  //       </li>
  //       <li>
  //         <NavLink to="/surveys/manage">Build a Survey</NavLink>
  //       </li>
  //       <li>
  //         <NavLink to="/surveys/review">Review a Survey</NavLink>
  //       </li>
  //       <li>
  //         <NavLink to="/clients">Manage Clients</NavLink>
  //       </li>
  //     </ul>
  //   </nav>
  // );

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <AdbIcon sx={{ display: { xs: "none", md: "flex" }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <Link to="/">LOGO</Link>
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <NavMenuXs
              sections={[surveyMenu]}
              handleOpen={handleOpenNavMenu}
              handleClose={handleCloseNavMenu}
              anchorEl={anchorEl}
            ></NavMenuXs>
          </Box>
          <AdbIcon sx={{ display: { xs: "flex", md: "none" }, mr: 1 }} />
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="#app-bar-with-responsive-menu"
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: ".3rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            LOGO
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            <NavMenuMd
              sections={[surveyMenu]}
              handleOpen={handleOpenNavMenu}
              handleClose={handleCloseNavMenu}
              anchorEl={anchorEl}
            ></NavMenuMd>
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }} data-testid="avatar-button">
                {session.doesSessionExist ? (
                  <Avatar sx={{ bgcolor: "darkgrey" }}>
                    <PersonIcon />
                  </Avatar>
                ) : (
                  <LoginIcon data-testid="sign-in-menu-control" />
                )}
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {session.doesSessionExist ? (
                <MenuItem>
                  <Typography sx={{ textAlign: "center" }}>
                    <Button onClick={logOutWithRedirect} data-testid="sign-out-button">Sign Out</Button>
                  </Typography>
                </MenuItem>
              ) : (
                publicSettings.items.map(({ label, route }) => (
                  <MenuItem key={label} onClick={handleCloseUserMenu}>
                    <Typography sx={{ textAlign: "center" }}>
                      <Link to={route}>{label}</Link>
                    </Typography>
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};
