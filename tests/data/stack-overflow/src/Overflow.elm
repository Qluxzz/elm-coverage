module Overflow exposing (overflow)


overflow : List String -> Int -> List String
overflow acc x =
    -- 4200 works with elm-test, but elm-coverage crashes
    -- Probably because it does more pre/post processing with the test in another loop, adding more stack frames
    if List.length acc == 4200 then
        acc
    else
        x + 1 |> overflow (acc ++ [String.fromInt x])
    