import { connect } from "react-redux";

const Loader = ({ loading, loadingMessage }) => {
    if (!loading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-200/80">
            <div className="flex flex-col items-center gap-4 max-w-[90%] text-center">

                {/* Modern Bouncing Dots Loader */}
                <div className="flex items-center justify-center gap-2 h-16">
                    <div className="w-4 h-4 rounded-full bg-[#0052CC] animate-bounce" style={{ animationDelay: '-0.3s' }}></div>
                    <div className="w-4 h-4 rounded-full bg-[#0052CC] animate-bounce" style={{ animationDelay: '-0.15s' }}></div>
                    <div className="w-4 h-4 rounded-full bg-[#0052CC] animate-bounce" style={{ animationDelay: '0s' }}></div>
                </div>
                {/* Spinner */}
                {/* <div className="w-16 h-16">
                    <div className="w-full h-full rounded-full border-4 border-[#0052CC] border-t-transparent border-r-transparent animate-spinDualRing"></div>
                </div> */}
                {/* Message */}
                {loadingMessage && (
                    <p className="text-sm font-medium text-gray-700 wrap-break-word max-w-md">
                        {loadingMessage}
                    </p>
                )}
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    loading: state.common.loading,
    loadingMessage: state.common.loadingMessage,
});

export default connect(mapStateToProps)(Loader);
