import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Outlet } from "react-router";

export default function AnimatedOutlet() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-1 flex-col"
            >
                <Outlet />
            </motion.div>
        </AnimatePresence>
    );
}
