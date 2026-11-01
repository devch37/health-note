package kr.gumjin.note;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/** 모듈 경계 규칙(docs/ARCHITECTURE.md §4). */
@AnalyzeClasses(packages = "kr.gumjin.note", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule auth는_user_repository를_직접_쓰지_않는다 = noClasses()
            .that().resideInAPackage("..note.auth..")
            .should().dependOnClassesThat().resideInAPackage("..note.user.repository..");

    @ArchTest
    static final ArchRule user는_auth에_의존하지_않는다 = noClasses()
            .that().resideInAPackage("..note.user..")
            .should().dependOnClassesThat().resideInAPackage("..note.auth..");

    @ArchTest
    static final ArchRule global은_기능_모듈에_의존하지_않는다 = noClasses()
            .that().resideInAPackage("..note.global..")
            .should().dependOnClassesThat().resideInAnyPackage("..note.auth..", "..note.user..");
}
