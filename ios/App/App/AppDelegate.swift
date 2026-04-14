import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let cream = UIColor(red: 250/255, green: 248/255, blue: 243/255, alpha: 1)
        // Paint every native layer cream so no gap ever shows as black
        self.window?.backgroundColor = cream
        DispatchQueue.main.async {
            if let vc = self.window?.rootViewController as? CAPBridgeViewController {
                vc.view.backgroundColor = cream
                if let scrollView = vc.webView?.scrollView {
                    scrollView.backgroundColor = cream
                    scrollView.isScrollEnabled = false
                    scrollView.bounces = false
                    // .never prevents iOS from adjusting scroll insets when keyboard opens,
                    // which would otherwise displace our fixed-position layout
                    scrollView.contentInsetAdjustmentBehavior = .never
                    scrollView.minimumZoomScale = 1.0
                    scrollView.maximumZoomScale = 1.0
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
