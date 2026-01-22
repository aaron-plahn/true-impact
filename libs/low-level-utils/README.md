# Low Level Utils

As developers, we choose a language for pragmatic reasons, often previous experience and the platform(s) we are targetting. You probably aren't writing your web client in Rust or your mobile app in Julia. We are never quite happy with our language (hence the large number of languages)! Low level utilities allow us to make the language work for us. They are shared across other libs and apps not necessarily because we are seeking a single-source-of-truth (as is the case in say sharing view model interfaces between the server and a client), but because of code reuse.

<!-- So far, we have had the occasion to introduce the following kinds of low level utilities.

## Response Mapping and Error Handling
We always return errors as values when handling errors from which we can recover, such as bad user input. We only throw exceptions (interrupt control flow) if we hit a system error, one which should be logically impossible (e.g. one that violates invariants that we have already validated). The latter is a form of defensive programming. We have introduced `TrueImpactError` and `TrueImpactException` to distinguish these cases.

We also make use of response-mapping to simplify our controllers and services on the server. We wrap return values in an `either` that forces the calling code to handle the error case (not unlike Go) while also allowing the user to map responses in the case of success without littering the code with `if(!isError(result))` everywhere.

## Math
When dealing with units of time, rounding, testing numerical results, and so on, it is useful to have access to a shared math lib.

## Utility Types
There are certain utility types (such as `Dto` or `DeepPartial`) that we inevitibly find ourselves re-introducing in every project.  -->
