const privateKeyPem = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCMbSylppkTJJn+
lQDhfmpbPNsKcDzFfWajDNS/NH49sDsb5tbFJrlyo2XsskMYNu6jPBcXpYu789sP
lt1Pu7BzA/+mM7lf8A6CSKbPY3exmK/5hI1uOvhz/BibbSEwUN8sBkDZDjHF+mWQ
kdWlfj6gH1JfZBly90K8wkwwuVHuz7IW3zjAtzbnzakeFQn0DPE7egbOuY+suew6
O7iBBHjkLcTRYUcD9USy0RvL+Tj0l7crW7WS+c1FeS1QNNLmY9PtpJF/ZceUuwfv
mtk6ns3/FTMJCDE6yBxAEc8TwBTyU9eMIc+jM0u4nekQULFtSPnABHzV2050lYO7
I+9+nl3VAgMBAAECggEAF/ARZRCL9hUuchUs4AOYdkKetT4SQfkhOqi4iHqWjYYB
4Xz9fgCeqsHbYVi28sUEc4uOBTApbIoCfPsS8WFVkBmtpgOZtVa65m8jjnVOlVXp
no496u4Buc3kVKcOV3YJftMXBHq8agXzwfM87W/l0DAAi3tN1uiEXvY0ih0jEBIEf
DdTmZtRUjXXjt8RyF/8qD3TlfliTR8dx+QLXPEy0V3K574RDW1znSaARrpbxFFGD
YBd01b5bDKQDXd3GHNesaec3ST3ppRHPRXgujcZfhZDCUVZ1RM02R86wxws0Sp1f
WlzhibLxT5Maqwq6zdnD616s/FHa/EKiHTiRlq8gGQKBgQDGTyduH75nG5gHvguG
mLq95bpUPbL+S4gu3onlgCRu8WfGEtVYD+iqYIDQy85H7/2mnO3iltckZpXyNDn1
fWggG8oPzCt/cvoD3Z8zYwn+mRwuXDaE38EA+EpeZp8V9nJFxc+foCNCLscayZly
U1XIez+3wKl/tyzIS0+OGHm12QKBgQC1R0V4ubzXHMM3u9G36dibV9XG93oOaaOW
IHBDwM/kXUTgtuZhr3+60es1R4WkAxfRQ0zs+6lIsOVZsSoZSjad2SkSaK/AiHij
EJ1qUlC9gM+nW4Qnwg8715IsI1d91W6McoKQMhK2XM60m6/O8rTf860bljiFOGnu
rwfSuYr+XQKBgFf5sZJnPr7bPPziUJarlty714ebv5aUx5ud/9rymDcnnVP/8umY
VS2QllUKtT6wtyR9JgOJy3P4lrjWdofz1Ie6DFAp0Xo+9a9VWFUhsMNkBV6DxiP4
Z9UYUVXDzPufU16kvNEh58JqoiW+HfbcBYhlNQU90XQ5PQK2dlqhfQ0xAoGAXHBC
icRU+nBtT99TmvABB33rwjDyKaVOyMAz3yjUGgRBmkFKC2gdvxtKUHnvOOpm28vw
zyupcCrcWTdRW2IPpcBWBFAjxw8QTT6stsnQ6EFmIlY1dryrXf2YSS+gbsdGPxIp
Z/RQvHNo6Io3RVVYTJcKn/WjTrOsuQzB9X+t0/UCgYAXhEgBXgD8nHmcXxC9llpM
S2QYk5XolNK08rbQTODSSe6qOsyLuvVjp/98vRmWWPo5+mrQ+MwfpKejuUX76LOf
B33TW21fcSZ4wuqVI/XxWPTpn5qiY3RfGoFFdVjSwzTouoLZFrwQ8CKr3wQVYf2a
QZT7TqwKpfku1akAudwebg==
-----END PRIVATE KEY-----`;

async function testImportKey() {
    try {
        const keyData = new TextEncoder().encode(privateKeyPem);
        const importedKey = await crypto.subtle.importKey(
            "pkcs8",
            keyData,
            {
                name: "RSASSA-PKCS1-V1_5",
                hash: "SHA-256",
            },
            false,
            ["sign"]
        );
        console.log("Local: Google Private Key imported successfully!");
    } catch (error) {
        console.error("Local: Failed to import Google Private Key:", error);
    }
}

testImportKey();