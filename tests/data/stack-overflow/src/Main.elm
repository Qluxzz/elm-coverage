module Main exposing (foo)

import Overview


foo : String
foo =
    "hello " ++ (List.head (Overflow.overflow [] 0) |> Maybe.withDefault "")
