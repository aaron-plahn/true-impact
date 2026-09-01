import AdbIcon from "@mui/icons-material/Adb";
import LoginIcon from "@mui/icons-material/Login";
import PersonIcon from "@mui/icons-material/Person";
import { MenuItem } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { JSX, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, UserSessionInfo } from "../../auth";
import { Loading } from "../loading";
import { NavMenuSection } from "./navmenu.interface";
import { NavMenuMd } from "./navmenu.md";
import { NavMenuXs } from "./navmenu.xs";

const isAdmin = (user?: UserSessionInfo | null) =>
  user !== null &&
  typeof user !== "undefined" &&
  ["admin", "system admin"].includes(user?.role);

/**
 * The available routes must be rendered in the context of the current user.
 *
 * One downside of a thick client is the need to reproduce such logic here. Using a
 * more server driven or true REST approach, the server would send the initial menu for
 * the specific user as a means of providing discoverability of the available routes.
 *
 */
const fullSurveyMenu: NavMenuSection = {
  label: "Surveys",
  items: [
    {
      label: "Complete a Survey",
      route: "/surveys/complete",
      /**
       * For now, we "keystone" this feature out. We provide a separate (SDUI based) client
       * for non-system users to complete surveys anonymously or via a 1-time passcode. This
       * is because it is important to manage a separate auth state for this session for security
       * reasons. Typically a clinician will open a survey and then hand their device to a client
       * to complete said survey.
       *
       * In the future, authenticated users may be able to complete surveys (e.g., employee surveys)
       * via the core system.
       */
      canUser: () => false,
    },
    {
      label: "Review a Survey",
      route: "/surveys/review",
      canUser: isAdmin,
    },
    {
      label: "Build a Survey",
      route: "/surveys/manage",
      canUser: isAdmin,
    },
  ],
};

// const _clientMenu: NavMenuSection = {
//   label: "Clients",
//   items: [
//     {
//       label: "Clients",
//       route: "/clients",
//     },
//   ],
// };

const publicSettings: NavMenuSection = {
  label: "Sign In",
  items: [
    {
      label: "Sign In",
      route: "/auth",
      // user => !user?
      canUser: (user) => true,
    },
  ],
};

export const NavBar = (): JSX.Element => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const session = useAuth();

  if (!session) {
    return <Loading />;
  }

  if (session?.isLoading) {
    return <Loading />;
  }

  const signOut = session.logOut;

  async function logOutWithRedirect() {
    await signOut();

    navigate("/");
  }

  if (session?.isLoading) {
    return <Loading />;
  }

  const { user } = session;

  console.log({ user });

  const surveyMenu = {
    label: fullSurveyMenu.label,
    items: fullSurveyMenu.items.filter((item) => item.canUser(user)),
  };

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
              <IconButton
                onClick={handleOpenUserMenu}
                sx={{ p: 0 }}
                data-testid="avatar-button"
              >
                {session?.doesSessionExist ? (
                  <Avatar
                    sx={{ bgcolor: "darkgrey" }}
                    data-testid="avatar-menu-control"
                  >
                    <PersonIcon />
                  </Avatar>
                ) : (
                  <div data-testid="sign-in-menu-control">
                    <LoginIcon />
                  </div>
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
              {session?.doesSessionExist ? (
                <MenuItem>
                  <Typography sx={{ textAlign: "center" }}>
                    <Button
                      onClick={logOutWithRedirect}
                      data-testid="sign-out-button"
                    >
                      Sign Out
                    </Button>
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
