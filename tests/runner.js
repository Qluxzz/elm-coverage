var spawn = require("cross-spawn"),
    chai = require("chai"),
    Promise = require("bluebird"),
    assert = chai.assert,
    expect = chai.expect,
    shell = require("shelljs"),
    path = require("path"),
    fs = require("fs-extra"),
    chaiMatchPattern = require("chai-match-pattern");

chai.use(require("chai-json-schema-ajv"));
chai.use(chaiMatchPattern);
var _ = chaiMatchPattern.getLodashModule();
_.mixin({
    matchesPath: (expected, actual) => actual.replace("\\", "/") === expected
});

var elmCoverage = require.resolve(path.join("..", "bin", "elm-coverage"));

describe("Sanity test", () => {
    it("prints the usage instructions when running with `--help`", done => {
        var process = spawn.spawn(elmCoverage, ["--help"]);
        var output = "";

        process.stderr.on("data", data => {
            console.error(data.toString());
        });
        process.stdout.on("data", data => {
            output += data;
        });

        process.on("exit", exitCode => {
            assert.equal(exitCode, 0, "Expected to exit with 0 exitcode");
            assert.notEqual(output, "", "Expected to have some output");
            done();
        });
    });
});

describe("E2E tests", function () {
    this.timeout(Infinity);
    it("Should run succesfully", done => {
        var process = spawn.spawn(elmCoverage, {
            cwd: path.join("tests", "data", "simple")
        });

        process.stderr.on("data", data => {
            console.error(data.toString());
        });

        process.on("exit", exitCode => {
            assert.equal(exitCode, 0, "Expected to finish succesfully");
            done();
        });
    });

    it("Should generate schema-validated JSON", () =>
        Promise.all([
            fs.readJSON(require.resolve("../docs/elm-coverage.json")),
            generateJSON("tests/data/simple")
        ]).spread((json, schema) => {
            expect(json).to.be.jsonSchema(schema);
        }));

    it("Should generate JSON that matches the pregenerated one, modulus runcount", () =>
        Promise.all([
            generateJSON("tests/data/simple"),
            fs.readJSON(require.resolve("./data/simple/expected.json"))
        ]).spread((actual, expectedJSON) => {
            var expected = {};

            //expected event is "coverage"
            expected.event = "coverage";

            // Ignore runcounts
            expected.coverageData = _.mapValues(
                expectedJSON.coverageData,
                moduleData =>
                    _.map(moduleData, coverage =>
                        Object.assign({}, coverage, {
                            count: _.isInteger
                        })
                    )
            );

            // System agnostic paths
            expected.moduleMap = _.mapValues(
                expectedJSON.moduleMap,
                modulePath => _.partial(_.matchesPath, modulePath, _)
            );

            expect(actual).to.matchPattern(expected);
        }));

    it.only("Should generate a HTML report", async () => {
        await generateHTML("tests/data/simple")

        const actual = await fs.readFile(path.resolve(__dirname, "./data/simple/.coverage/coverage.html"))
        const expected = fs.readFile(path.resolve(__dirname, "./data/simple/expected.html"))
        expect(actual).to.equal(expected)
    });
});

/**
 * Run elm coverage to generate a Json report
 * @param {string} pathToTest 
 * @returns json report
 */
function generateJSON(pathToTest) {
    return new Promise((resolve, reject) => {
        var process = spawn.spawn(
            elmCoverage,
            ["generate", "--report", "json"],
            {
                cwd: pathToTest
            }
        );

        var output = "";

        process.stdout.on("data", data => {
            output += data;
        });

        process.stderr.on("data", data => {
            console.error(data.toString());
        });

        process.on("exit", exitCode => {
            assert.equal(exitCode, 0, "Expected to finish successfully");
            if (exitCode === 0) {
                resolve(output);
            } else {
                reject(new Error("Expected to finish successfully"));
            }
        });
    }).then(json => JSON.parse(json));
}

/**
 * Run elm coverage to generate an HTML report
 * @param {*} pathToTest
 * @returns 
 */
function generateHTML(pathToTest) {
    return new Promise((resolve, reject) => {
        var process = spawn.spawn(
            elmCoverage,
            ["generate", "--report", "human"],
            {
                cwd: path.resolve(__dirname, pathToTest)
            }
        );

        var output = "";

        process.stdout.on("data", data => {
            output += data;
        });

        process.stderr.on("data", data => {
            console.error(data.toString());
        });

        process.on("exit", exitCode => {
            assert.equal(exitCode, 0, "Expected to finish successfully");
            if (exitCode === 0) {
                resolve(output);
            } else {
                reject(new Error("Expected to finish successfully"));
            }
        });
    });
}
