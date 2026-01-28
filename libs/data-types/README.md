# @true-impact/data-types

This library establishes an idiom for internal data types. It includes

- schema annotations for
- schema-based validation of data transfer objects (DTOs)
- low-level validation predicate functions
- a base class for all entities
- helpers for cloning and serializing objects
- a shallow hierarchy of `Error` classes that represent recoverable errors (e.g., bad user requests) and non-recoverable actual exceptions

This library allows us to validate schemas for data transfer objects (DTOs) in-memory without needing to synchronize schemas in the underlying database. This also allows for in-memory implementations of the data persistence layer. Finally, it provides the basis for managing schemas for API documentation.
