# Email Confirmation Troubleshooting Guide

## Issue: Getting `/auth/auth-code-error` After Email Confirmation

If you're seeing a 404 or being redirected to the auth error page after clicking the email confirmation link, follow this guide.

## Quick Fix

I've just created the error page at `/auth/auth-code-error`, so you should now see a helpful error message instead of a 404.

## Common Causes & Solutions

### 1. Email Confirmation Already Completed

**Symptom:** Error page appears even though you haven't confirmed before.

**Solution:** Try logging in directly:
```
1. Go to http://localhost:3000/login
2. Enter your email and password
3. If your email was already confirmed, you'll be able to log in
```

### 2. Confirmation Link Expired

**Symptom:** Link doesn't work after 24+ hours.

**Default:** Supabase confirmation links expire after 24 hours.

**Solution:** Request a new confirmation email or sign up again.

### 3. Incorrect Redirect URL Configuration

**Most Common Issue!**

**Check your Supabase configuration:**

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Check these settings:

**Site URL:**
```
Development: http://localhost:3000
Production: https://your-domain.com
```

**Redirect URLs (Allow list):**
```
http://localhost:3000/**
http://localhost:3000/auth/callback
https://your-domain.com/**
https://your-domain.com/auth/callback
```

### 4. Email Template Issues

**Check the email template:**

1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Select "Confirm signup"
3. Verify the confirmation link uses the correct format:

**Correct format:**
```html
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
```

or with code parameter:

```html
{{ .SiteURL }}/auth/callback?code={{ .Code }}&type=email
```

**Common mistake:** Using old format like:
```html
{{ .ConfirmationURL }}  ❌ (Old format, may not work)
```

## Step-by-Step Fix

### For Development (localhost:3000)

**1. Update Supabase Settings:**

```yaml
Authentication → URL Configuration:
  Site URL: http://localhost:3000
  
  Redirect URLs:
    - http://localhost:3000/**
    - http://localhost:3000/auth/callback
```

**2. Update Email Template:**

Go to: **Authentication** → **Email Templates** → **Confirm signup**

Replace the confirmation link with:

```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your account:</p>
<p><a href="{{ .SiteURL }}/auth/callback?code={{ .Code }}&type=email">Confirm your email</a></p>
```

**3. Test:**
```bash
1. Delete the existing test user (if any)
2. Sign up again with a new email
3. Check email for confirmation link
4. Click the link
5. Should redirect to dashboard successfully
```

### For Production

**1. Update Site URL:**
```
Site URL: https://your-actual-domain.com
```

**2. Update Redirect URLs:**
```
- https://your-actual-domain.com/**
- https://your-actual-domain.com/auth/callback
```

**3. Update Environment Variable:**

In your `.env.local`:
```env
NEXT_PUBLIC_SITE_URL=https://your-actual-domain.com
```

## Disable Email Confirmation (For Testing)

If you want to skip email confirmation during development:

**1. Go to Supabase Dashboard**
**2. Authentication → Settings → Email Confirmation**
**3. Toggle OFF "Enable email confirmations"**

Now users can log in immediately after signup without confirming email.

## Check Server Logs

After clicking the confirmation link, check your Next.js server logs for:

**Success:**
```
✅ Email confirmed successfully for user: user@example.com
```

**Error:**
```
❌ Auth callback error: [error message]
```

**No code:**
```
❌ No auth code provided in callback
```

## Test the Auth Flow

### Test Confirmation URL Manually

1. Sign up with a test email
2. Check the email source (View Original/Raw)
3. Find the confirmation link
4. Verify it looks like:
   ```
   http://localhost:3000/auth/callback?code=XXXXX&type=email
   ```
5. Paste it in your browser
6. Check the network tab in dev tools
7. Should redirect to `/` (dashboard)

### Debug Mode

Add logging to see what's happening:

**In `/app/auth/callback/route.ts`:**
```typescript
// Already added logging:
console.log('✅ Email confirmed successfully')
console.log('❌ Auth callback error:', error.message)
```

Check your terminal after clicking the confirmation link.

## Common Supabase Settings

### Recommended Settings for Development

```yaml
Email Confirmation: Disabled (easier testing)
Site URL: http://localhost:3000
Redirect URLs: http://localhost:3000/**
```

### Recommended Settings for Production

```yaml
Email Confirmation: Enabled (better security)
Site URL: https://your-domain.com
Redirect URLs: https://your-domain.com/**
Password Requirements: Strong (8+ chars, complexity)
```

## Alternative: Use Magic Links

If email confirmation continues to be problematic, consider using Magic Links instead:

```typescript
// Instead of signUp with password
const { error } = await supabase.auth.signInWithOtp({
  email: email,
  options: {
    emailRedirectTo: 'http://localhost:3000/auth/callback',
  },
})
```

This sends a one-time login link instead of requiring password + confirmation.

## Files Updated

I've created/updated these files to handle the error properly:

1. **`/app/auth/auth-code-error/page.tsx`** - Error page with helpful instructions
2. **`/app/auth/callback/route.ts`** - Improved logging and error handling

## Still Having Issues?

### Check These:

1. **Supabase Project Status**
   - Is your project paused?
   - Check dashboard for any alerts

2. **Email Provider**
   - Some email providers block auth emails
   - Check spam folder
   - Try a different email provider

3. **Browser Cookies**
   - Make sure cookies are enabled
   - Try incognito/private mode
   - Clear browser cache

4. **URL Encoding**
   - Make sure the confirmation URL isn't being mangled
   - Check for URL encoding issues in email client

### Get More Info:

**Check Supabase Logs:**
1. Dashboard → Logs
2. Filter by auth events
3. Look for confirmation errors

**Check Network Tab:**
1. Open browser DevTools
2. Go to Network tab
3. Click confirmation link
4. See what requests are made
5. Check for any failed requests

## Summary

The most common fix is:
1. ✅ Set Site URL in Supabase Dashboard
2. ✅ Add redirect URLs to allow list
3. ✅ Update email template to use new format
4. ✅ Test with a fresh signup

Your error page is now live, so at least users will see helpful information instead of a 404!
