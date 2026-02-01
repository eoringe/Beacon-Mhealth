# Setting Up Custom Email Domain for Firebase Authentication

To prevent your verification emails from landing in spam folders and to present a professional image (e.g., `noreply@yourcompany.com` instead of `noreply@beaconmobile-256f4.firebaseapp.com`), you need to verify your custom domain in the Firebase Console.

This process involves adding specific DNS records to your domain provider (e.g., GoDaddy, Namecheap, Google Domains) to authorize Firebase to send authenticated emails on your behalf.

## Step 1: Add Your Domain to Firebase

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project: **Beacon Mobile**.
3.  In the left menu, select **Authentication**.
4.  Navigate to the **Templates** tab.
5.  Click on **Email address verification**.
6.  Click the **Edit** (pencil) icon next to the "Sender" field usually saying something like `noreply@...`.
7.  Click **Customize domain**.
8.  Enter your company's domain name (e.g., `beaconhealth.com` or `beaconchildrenscenter.com`).
9.  Click **Continue**.

## Step 2: Update DNS Records in Vercel

Based on your screenshots, you have **4 records** to add.

> **⚠️ Important Check:** Your Firebase screenshot shows `beaconchildrencenter.co.ke` (**CENTER**), but you mentioned `beaconchildrencentre.co.ke` (**CENTRE**). Please verify which spelling is correct for your actual domain. You must use the one you own.

### 1. Verification Record (TXT)
*   **Type:** `TXT`
*   **Name:** (Leave Empty for Vercel)
*   **Value:** `firebase=beaconmobileapp-256f4`

### 2. SPF Record (TXT)
*   **Type:** `TXT`
*   **Name:** (Leave Empty for Vercel)
*   **Value:** `v=spf1 include:_spf.firebasemail.com ~all`
*   *Note: If you get an "IPv4" error in Vercel, refresh the page and make sure you select "TXT" before typing the value.*

### 3. DKIM Record 1 (CNAME)
*   **Type:** `CNAME`
*   **Name:** `firebase1._domainkey`
*   **Value:** `mail-beaconchildrencenter-co-ke.dkim1._domainkey.firebasemail.com`

### 4. DKIM Record 2 (CNAME)
*   **Type:** `CNAME`
*   **Name:** `firebase2._domainkey`
*   **Value:** `mail-beaconchildrencenter-co-ke.dkim2._domainkey.firebasemail.com`

### Troubleshooting Vercel Errors
If you see **"Invalid request: 'value' should match format ipv4"**:
1.  This is a Vercel UI glitch where it thinks you are adding an **A Record**.
2.  Refresh the page.
3.  Select **TXT** *first* from the dropdown.
4.  Leave the **Name** field **Empty** (do not type `@`).
5.  Paste the value.
6.  Click Add.

## Step 3: Verify and Update Sender Address

1.  Go back to the Firebase Console popup and click **Verify**.
2.  Once verified (status turns green), you can change the "From" address in the **Templates** tab.
3.  Click the **Edit** icon again.
4.  In the "From" field, update the address to: `noreply@beaconchildrencentre.co.ke` (or `info@`, `support@`, etc.).
5.  Click **Save**.

## Step 4: Apply to All Templates

Repeat **Step 3** for other email templates that your app might use:
*   **Password reset**
*   **Email address change**

## Summary

By completing these steps, your emails will:
*   Come from your official domain.
*   Be signed / authenticated (DKIM/SPF).
*   Be significantly less likely to be marked as spam.

## Step 5: Customize the Action URL (The Link Itself)

To change the link in the email (currently `https://beaconmobileapp...firebaseapp.com/...`) to your own domain, you must use **Firebase Hosting**.

**⚠️ CRITICAL WARNING:** Since your main website (`beaconchildrencentre.co.ke`) is hosted on **Vercel**, you **CANNOT** use the same root domain here. Doing so would take your website offline.
**Account for this:** You must use a **subdomain**, such as `auth.beaconchildrencentre.co.ke`.

### 1. Set up Firebase Hosting
1.  Go to **Build** -> **Hosting** in the Firebase Console sidebar.
2.  Click **Get started** (follow the prompts, you don't need to deploy any actual code yet).
3.  Click **Add custom domain**.
4.  Enter `auth.beaconchildrencentre.co.ke` (or any subdomain you prefer).
5.  Click **Continue**.

### 2. Verify Domain ownership (if prompted)
Since you already verified the root domain for email, this might be automatic. If not, follow the prompts.

### 3. Add DNS Records in Vercel
**Make sure you are on the "Quick setup" tab in Firebase (not Advanced).**
Firebase has provided a **CNAME Record**.
1.  Go to your **Vercel Dashboard** -> Domains.
2.  Add the **CNAME Record**:
    *   **Type:** `CNAME`
    *   **Name:** `auth`
    *   **Value:** `beaconmobileapp-256f4.web.app` (or whatever value Firebase gave you)
    *   **TTL:** 60 (default)

### 4. Update the Action URL in Authentication
1.  Wait for the domain to verify in the Hosting tab (can take up to an hour).
2.  Go back to **Authentication** -> **Templates**.
3.  Click **Edit** on a template.
4.  Click **Customize action URL**.
5.  Select your new custom domain (`https://auth.beaconchildrencentre.co.ke/...`) from the list.
6.  Click **Save**.

Now your emails will contain links like `https://auth.beaconchildrencentre.co.ke/__auth/action...`, looking fully professional.
