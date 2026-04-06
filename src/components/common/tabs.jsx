import { Box } from "@mui/material";

export const Tabs = ({ selectedTab, handleChange, tabsData, type = "default", center = false, fontSize = null }) => {

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: center ? "center" : "start",
        gap: "20px",
        borderBottom: "none",
        overflowX: "auto",
        whiteSpace: "nowrap",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        backgroundColor: type === "header" ? "#ffffff" : "transparent",
        fontFamily: '"Inter", sans-serif'
      }}
    >
      {[...new Map(tabsData?.map((item) => [item.label, item])).values()].map(
        (item, index) => {
          const isSelected = selectedTab === index;
          const isHeaderType = type === "header";

          return (
            <Box
              key={index}
              onClick={() => handleChange(index)}
              sx={{
                color: isSelected ? "#0052CC" : "#000000",
                fontWeight: isSelected ? 600 : 400,
                fontSize: fontSize ? fontSize : "20px",
                textTransform: "none",
                padding: "8px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "7px",
                position: "relative",
                fontFamily: '"Inter", sans-serif',
                transition: "background-color 0.3s ease",

                // Keep the background logic for the header type
                backgroundColor: "transparent",

                // The Animated Bottom Border
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)", // Centers the line so it grows outward
                  height: isHeaderType ? "3px" : "3px",
                  width: isSelected ? "100%" : "0%", // Full width if selected, 0% if not
                  backgroundColor: "#0052CC",
                  transition: "width 0.3s ease-in-out", // The animation effect
                },

                // Triggers the width to expand to 100% on hover
                "&:hover::after": {
                  width: "100%",
                }
              }}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label && <span>{item.label}</span>}
            </Box>
          );
        }
      )}
    </Box>
  );
};