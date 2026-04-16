import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    // Keeps the KVO observation alive for the lifetime of the app
    private var scrollOffsetObservation: NSKeyValueObservation?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let cream = UIColor(red: 250/255, green: 248/255, blue: 243/255, alpha: 1)
        self.window?.backgroundColor = cream
        DispatchQueue.main.async {
            guard let vc = self.window?.rootViewController as? CAPBridgeViewController else { return }
            vc.view.backgroundColor = cream
            // Accessing vc.view triggers viewDidLoad → WKWebView is created
            guard let webView = vc.webView else { return }
            let scrollView = webView.scrollView

            // Make the WKWebView itself cream so any uncovered area never flashes white
            webView.backgroundColor = cream
            webView.isOpaque = false

            scrollView.backgroundColor = cream
            scrollView.isScrollEnabled = false
            scrollView.bounces = false
            scrollView.minimumZoomScale = 1.0
            scrollView.maximumZoomScale = 1.0

            // Prevent iOS auto-adjusting content insets — CSS env(safe-area-inset-*)
            // handles safe areas in the web layer
            scrollView.contentInsetAdjustmentBehavior = .never
            scrollView.contentInset = .zero
            scrollView.contentOffset = .zero

            // KVO observer: enforces contentOffset = .zero whenever WKWebView
            // internally tries to set it during its layout/paint passes.
            // This fires immediately and synchronously whenever the value changes,
            // so there is no timing window where a non-zero offset can persist.
            // isScrollEnabled=false means no legitimate user scroll will ever
            // set a non-zero offset, so this is always safe to enforce.
            self.scrollOffsetObservation = scrollView.observe(
                \.contentOffset,
                options: [.new]
            ) { sv, change in
                guard let newOffset = change.newValue, newOffset != .zero else { return }
                sv.contentOffset = .zero
            }
        }
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
