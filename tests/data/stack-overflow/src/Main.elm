module Main exposing (foo)

import Overflow


foo : String
foo =
    "hello " ++ (List.head (Overflow.overflow [] 0) |> Maybe.withDefault "")
