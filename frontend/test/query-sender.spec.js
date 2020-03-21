describe("sendQuery test suite", function () {
    let queryFixtures = TTT.getQueryFixtures();
    let queryDescriptions = TTT.getQueryDescriptions();
    for (let queryName in queryFixtures) {
        if (queryFixtures.hasOwnProperty(queryName)) {
            let query = queryFixtures[queryName];
            if (TTT.hasHtmlFixture(queryName)) {
                it(`~Sea${queryName}~Should be able to send a ${queryDescriptions[queryName]}`, function () {
                    expect(CampusExplorer.sendQuery(query)).to.sendAjaxRequest(query);
                    // console.log(1);
                    // CampusExplorer.sendQuery(query).then((arr) => {
                    //     console.log(3);
                    //     console.log(arr);
                    // }).catch((err) => {
                    //     console.log(4);
                    // });
                    // console.log(2);
                    // expect(CampusExplorer.sendQuery(query).then((res) => {
                    //     console.log(3);
                    //     console.log(res);
                    //     expect.fail();
                    // }).catch((err) => {
                    //     console.log(4);
                    //     console.log("err");
                    //     expect.fail();
                    //  }));
                });
            }
        }
    }

});
