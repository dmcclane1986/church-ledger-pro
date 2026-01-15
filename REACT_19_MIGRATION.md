# React 19 Migration Notes

## Overview

Church Ledger Pro has been updated to use React 19 APIs with Next.js 16.

## Breaking Changes

### `useFormState` → `useActionState`

React 19 renamed `useFormState` to `useActionState` and changed its import location.

**Before (React 18):**
```typescript
import { useFormState } from 'react-dom'

export default function MyForm() {
  const [state, formAction] = useFormState(myAction, initialState)
  // ...
}
```

**After (React 19):**
```typescript
import { useActionState } from 'react'

export default function MyForm() {
  const [state, formAction] = useActionState(myAction, initialState)
  // ...
}
```

### Server Action Signature Change

With `useActionState`, server actions now receive the previous state as the first parameter.

**Before:**
```typescript
export async function myAction(formData: FormData) {
  const email = formData.get('email')
  // ...
}
```

**After:**
```typescript
export async function myAction(prevState: any, formData: FormData) {
  const email = formData.get('email')
  // ...
}
```

## Files Updated

### Login System
1. `/app/login/LoginForm.tsx`
   - Changed import from `useFormState` to `useActionState`
   - Import now from `'react'` instead of `'react-dom'`

2. `/app/login/actions.ts`
   - Updated `login()` signature to accept `prevState` as first parameter

### Signup System
3. `/app/signup/SignupForm.tsx`
   - Changed import from `useFormState` to `useActionState`
   - Import now from `'react'` instead of `'react-dom'`

4. `/app/signup/actions.ts`
   - Updated `signup()` signature to accept `prevState` as first parameter

## Testing

After these changes, verify:
- ✅ Login form works without errors
- ✅ Signup form works without errors
- ✅ Form state management functions correctly
- ✅ Error messages display properly
- ✅ Success flows work as expected

## Why This Change?

React 19 consolidated form-related hooks into the main `react` package:
- Better tree-shaking
- Clearer API boundaries
- Consistency with other React APIs
- Preparation for React Server Components evolution

## Additional React 19 Features Available

Now that you're on React 19, you can also use:
- `useOptimistic` - Optimistic UI updates
- `use` - Unwrap promises in render
- `<form action>` improvements
- Better async transitions

## Reference

- [React 19 Release Notes](https://react.dev/blog/2024/04/25/react-19)
- [useActionState Documentation](https://react.dev/reference/react/useActionState)
- [Next.js 16 with React 19](https://nextjs.org/blog/next-16)
