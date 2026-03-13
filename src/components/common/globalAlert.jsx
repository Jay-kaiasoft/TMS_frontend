import React, { useEffect } from "react";
import { connect } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { setAlert } from "../../redux/commonReducers/commonReducers";

function GlobalAlert({ alert, setAlert }) {
  useEffect(() => {
    if (alert.open) {
      // Clear any existing toasts before showing a new one
      toast.dismiss();

      switch (alert.type) {
        case "success":
          toast.success(alert.message, { icon: "✅" });
          break;
        case "error":
          toast.error(alert.message, { icon: "❌" });
          break;
        case "warning":
          toast.warning(alert.message, { icon: "⚠️" });
          break;
        case "info":
          toast.info(alert.message, { icon: "ℹ️" });
          break;
        default:
          toast(alert.message);
      }

      // Reset redux state so it doesn’t loop
      setAlert({ open: false, message: "", type: "" });
    }
  }, [alert, setAlert]);

  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      closeOnClick
      pauseOnHover
      draggable
      theme="light"  // gives the colored style like your screenshot
      limit={1}        // ensures only ONE toast shows at a time
      toastStyle={{
        width: alert.type === "error" || alert.type === "warning" ? "420px" : "full",        // 🔥 increase width
        minHeight: "60px",     // optional – taller look
        fontSize: "15px",      // optional – better readability
      }}
    />
  );
}

const mapStateToProps = (state) => ({
  alert: state.common.alert,
});

export default connect(mapStateToProps, { setAlert })(GlobalAlert);