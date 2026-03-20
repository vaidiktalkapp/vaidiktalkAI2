import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsArray, IsBoolean, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAiAstrologerDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    image?: string;

    @IsString()
    @IsOptional()
    profilePicture?: string;

    @IsString()
    @IsNotEmpty()
    bio: string;

    @IsNumber()
    @IsOptional()
    @Min(0)
    experience?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    experienceYears?: number;

    @IsString()
    @IsOptional()
    education?: string;


    @IsString()
    @IsOptional()
    focusArea?: string;

    @IsString()
    @IsOptional()
    expertise?: string;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    specialization?: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    specializations?: string[];

    @IsString()
    @IsNotEmpty()
    personalityType: string;

    @IsString()
    @IsOptional()
    tone?: string;

    @IsString()
    @IsOptional()
    styleGuide?: string;

    @IsString()
    @IsOptional()
    systemPromptAddition?: string;

    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    @Min(0)
    ratePerMinute: number;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    languages?: string[];

    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;

    @IsString()
    @IsOptional()
    tagline?: string;

    @IsString()
    @IsOptional()
    profileColor?: string;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    sampleQueries?: string[];

    @IsOptional()
    aiModelParams?: {
        temperature: number;
        topP: number;
        maxOutputTokens: number;
    };

    @IsBoolean()
    @IsOptional()
    isPromoted?: boolean;

    @IsString()
    @IsOptional()
    voiceId?: string;

    @IsOptional()
    pricing?: {
        chat?: number;
        call?: number;
        videoCall?: number;
    };
}
