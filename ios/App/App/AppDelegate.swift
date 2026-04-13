import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Prevent the WKWebView scroll view from shifting when the keyboard appears.
        // iOS normally scrolls the webview to reveal the focused input above the
        // keyboard, which displaces our fixed-position layout container.
        // Setting contentInsetAdjustmentBehavior = .never stops this at the OS level.
        // Set UIWindow background to cream so no black shows behind the WKWebView
        self.window?.backgroundColor = UIColor(red: 250/255, green: 248/255, blue: 243/255, alpha: 1)
        DispatchQueue.main.async {
            if let vc = self.window?.rootViewController as? CAPBridgeViewController,
               let scrollView = vc.webView?.scrollView {
                scrollView.isScrollEnabled = false
                scrollView.bounces = false
                scrollView.contentInsetAdjustmentBehavior = .never
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
