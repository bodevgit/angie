import { useRegisterSW } from 'virtual:pwa-register/react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X } from 'lucide-react'

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-auto"
        >
          <div className="bg-[#1E1F22] border border-gray-700 p-4 rounded-xl shadow-2xl flex items-center gap-4">
            <div className="flex-1">
              {offlineReady ? (
                <span className="text-sm text-gray-200">App ready to work offline</span>
              ) : (
                <span className="text-sm text-gray-200">New content available, click on reload button to update.</span>
              )}
            </div>
            {needRefresh && (
              <button
                className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                onClick={() => updateServiceWorker(true)}
              >
                <RefreshCw size={18} />
              </button>
            )}
            <button
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-2 rounded-lg transition-colors"
              onClick={close}
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
