import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let cream = UIColor(red: 250/255, green: 248/255, blue: 243/255, alpha: 1)
        // Paint every native layer cream so no gap ever shows as white/black
        self.window?.backgroundColor = cream
        DispatchQueue.main.async {
            if let vc = self.window?.rootViewController as? CAPBridgeViewController {
                vc.view.backgroundColor = cream
                // Accessing vc.view triggers viewDidLoad which creates the WKWebView
                if let scrollView = vc.webView?.scrollView {
                    scrollView.backgroundColor = cream
                    scrollView.isScrollEnabled = false
                    scrollView.bounces = false
                    scrollView.minimumZoomScale = 1.0
                    scrollView.maximumZoomScale = 1.0
                    // Stop iOS auto-adjusting content insets for safe areas —
                    // our CSS env(safe-area-inset-*) handles that in the web layer
                    scrollView.contentInsetAdjustmentBehavior = .never
                    // Explicitly zero out any offset/inset that the default .automatic
                    // behavior may have already applied before we switched to .never
                    scrollView.contentInset = .zero
                    scrollView.contentOffset = .zero
                }
                // Second pass after 150 ms — WKWebView can re-apply a content offset
                // during its first layout/paint pass, after our sync reset above
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                    vc.webView?.scrollView.contentInset = .zero
                    vc.webView?.scrollView.contentOffset = .zero
                }
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
