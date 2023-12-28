module Example exposing (..)

import Expect
import Overflow
import Test exposing (..)


cases = Overflow.overflow [] 0

suite : Test
suite =
    describe "Overflow bug when creating report"
        (List.map (\i -> test i <|
            \_ -> Expect.equal i i)
            cases
        ) 
